const { LavalinkManager } = require("lavalink-client");

class CompatQueue {
    constructor() {
        this.tracks = [];
        this.current = null;
    }

    add(trackOrTracks) {
        if (!trackOrTracks) return;
        if (Array.isArray(trackOrTracks)) this.tracks.push(...trackOrTracks);
        else this.tracks.push(trackOrTracks);
    }

    shuffle() {
        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
        }
        return this;
    }

    map(fn) {
        return this.tracks.map(fn);
    }

    slice(start, end) {
        return this.tracks.slice(start, end);
    }

    get length() {
        return this.tracks.length;
    }

    get size() {
        return this.tracks.length;
    }

    shift() {
        return this.tracks.shift();
    }
}

class CompatPlayer {
    constructor(manager, guildId, options) {
        this._manager = manager;
        this.guild = guildId;
        this.voiceChannel = options.voiceChannel;
        this.textChannel = options.textChannel;
        this.selfDeafen = options.selfDeafen ?? true;

        this.queue = new CompatQueue();
        this.state = "DISCONNECTED";
        this.playing = false;
        this.paused = false;
        this.trackRepeat = false;
        this.queueRepeat = false;
        this.position = 0;
        this.volume = 100;

        this.node = { connected: true, connect: async () => {} };
        this._store = new Map();
        this._rawPlayer = null;
    }

    set(key, value) {
        this._store.set(key, value);
        return this;
    }

    get(key) {
        return this._store.get(key);
    }

    async connect() {
        this.state = "CONNECTED";
        if (!this._rawPlayer) {
            // createPlayer() is synchronous — no await needed
            this._rawPlayer = this._manager._ll.createPlayer({
                guildId: this.guild,
                voiceChannelId: this.voiceChannel,
                textChannelId: this.textChannel,
                selfDeaf: this.selfDeafen,
            });
        } else if (this._rawPlayer.options.voiceChannelId !== this.voiceChannel) {
            // Voice channel changed — use changeVoiceState
            await this._rawPlayer.changeVoiceState({ voiceChannelId: this.voiceChannel });
        }
        // Send op:4 to Discord to (re)join the voice channel
        await this._rawPlayer.connect();
        // Wait for Lavalink to receive the VOICE_SERVER_UPDATE and establish the voice session.
        // player.voice.token is set once lavalink-client sends voice credentials to Lavalink.
        // Poll up to 5 seconds (50 × 100 ms) before giving up.
        for (let i = 0; i < 50; i++) {
            if (this._rawPlayer.voice?.token) break;
            await new Promise(r => setTimeout(r, 100));
        }
        return this;
    }

    async play() {
        if (!this.queue.current) this.queue.current = this.queue.shift();
        if (!this.queue.current || !this._rawPlayer) return this;
        const encoded =
            this.queue.current.encoded || this.queue.current.track || this.queue.current.encodedTrack;
        if (!encoded) return this;
        // Lavalink-client v2 expects: player.play({ track: { encoded: "..." } })
        await this._rawPlayer.play({ track: { encoded } });
        // Do NOT manually emit trackStart here – lavalink-client will fire it via the
        // "trackStart" event listener set up in CompatManager, preventing double-fires.
        return this;
    }

    async pause(toggle = true) {
        this.paused = Boolean(toggle);
        this.playing = !this.paused; // keep in sync — !playing is what all embed checks use to show "Resume"
        // lavalink-client has separate pause()/resume() methods with state-checks that throw
        // if already in the target state. Use updatePlayer() directly to avoid that.
        if (this._rawPlayer?.node) {
            try {
                await this._rawPlayer.node.updatePlayer({
                    guildId: this.guild,
                    playerOptions: { paused: this.paused },
                });
            } catch (e) {
                // Ignore (e.g., node not ready yet)
            }
        }
        return this;
    }

    async stop() {
        // Tell Lavalink to stop the current track.
        // The queueEnd event listener in CompatManager will advance the queue.
        if (this._rawPlayer) {
            try {
                await this._rawPlayer.stopPlaying();
            } catch (e) {
                console.error("[CompatPlayer.stop] stopPlaying error:", e?.message || e);
            }
        }
        return this;
    }

    async seek(position) {
        this.position = Number(position) || 0;
        if (this._rawPlayer && typeof this._rawPlayer.seek === "function") {
            await this._rawPlayer.seek(this.position);
        }
        return this;
    }

    async setVolume(volume) {
        this.volume = Number(volume) || 100;
        if (this._rawPlayer && typeof this._rawPlayer.setVolume === "function") {
            await this._rawPlayer.setVolume(this.volume);
        }
        return this;
    }

    async setEQ() {
        return this;
    }

    setTrackRepeat(state) {
        this.trackRepeat = Boolean(state);
        return this;
    }

    setQueueRepeat(state) {
        this.queueRepeat = Boolean(state);
        return this;
    }

    async destroy() {
        this.state = "DISCONNECTED";
        this.playing = false;
        this.paused = false;
        if (this._rawPlayer) {
            try {
                await this._rawPlayer.destroy();
            } catch (e) {
                // Player may already be gone
            }
        }
        this._manager.players.delete(this.guild);
        this._manager.emit("playerDestroy", this);
        return this;
    }
}

class CompatManager {
    constructor(client, nodes) {
        this.client = client;
        this.players = new Map();

        this._ll = new LavalinkManager({
            nodes,
            sendToShard: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },
            autoSkip: false, // We handle queue advancement ourselves
            playerOptions: {
                applyVolumeAsFilter: false,
                clientBasedPositionUpdateInterval: 250,
                defaultSearchPlatform: "ytmsearch",
            },
        });

        // ── Node events ──────────────────────────────────────────────────────────
        const nodeOpts = node => {
            const opts = node.options || node;
            return { options: { ...opts, identifier: opts.identifier || opts.id || opts.host } };
        };
        this._ll.nodeManager.on("connect", node =>
            this.emit("nodeConnect", nodeOpts(node))
        );
        this._ll.nodeManager.on("reconnecting", node =>
            this.emit("nodeReconnect", nodeOpts(node))
        );
        this._ll.nodeManager.on("disconnect", (node, reason) =>
            this.emit("nodeDisconnect", nodeOpts(node), reason || {})
        );
        this._ll.nodeManager.on("error", (node, error) =>
            this.emit("nodeError", nodeOpts(node), error)
        );

        // ── Player / track events from lavalink-client ───────────────────────────
        this._ll.on("trackStart", (rawPlayer, track, payload) => {
            const compatPlayer = this.players.get(rawPlayer.guildId);
            if (!compatPlayer) return;
            compatPlayer.playing = true;
            compatPlayer.paused = false;
            compatPlayer.state = "CONNECTED";
            this.emit("trackStart", compatPlayer, compatPlayer.queue.current);
        });

        // lavalink-client always routes normal track endings through its own queueEnd
        // (because our raw player queue is always empty — we manage our own compat queue).
        // So we listen to "queueEnd" from lavalink-client to drive our queue advancement.
        this._ll.on("queueEnd", (rawPlayer, track, payload) => {
            const compatPlayer = this.players.get(rawPlayer.guildId);
            if (!compatPlayer) return;

            const endedTrack = compatPlayer.queue.current;
            compatPlayer.playing = false;
            compatPlayer.queue.current = null;

            this.emit("trackEnd", compatPlayer, endedTrack);

            // Handle repeat modes before advancing
            if (compatPlayer.queueRepeat && endedTrack) compatPlayer.queue.add(endedTrack);
            if (compatPlayer.trackRepeat && endedTrack) compatPlayer.queue.tracks.unshift(endedTrack);

            if (compatPlayer.queue.length > 0) {
                compatPlayer.play().catch(e =>
                    console.error("[CompatManager queueEnd] play error:", e?.message || e)
                );
            } else {
                this.emit("queueEnd", compatPlayer);
            }
        });

        this._ll.on("trackStuck", (rawPlayer, track, payload) => {
            const compatPlayer = this.players.get(rawPlayer.guildId);
            if (!compatPlayer) return;
            this.emit("trackStuck", compatPlayer, compatPlayer.queue.current, payload);
            // lavalink-client's trackStuck handler already sends an empty-track update to Lavalink
            // internally (when raw queue is empty, which is always the case for us), so we do NOT
            // call stop() here — that would cause a second empty-track update and double-fire queueEnd.
        });

        this._ll.on("trackError", (rawPlayer, track, payload) => {
            const compatPlayer = this.players.get(rawPlayer.guildId);
            if (!compatPlayer) return;
            this.emit("trackError", compatPlayer, compatPlayer.queue.current, payload);
            // Advance the queue
            compatPlayer.stop().catch(() => {});
        });

        this._ll.on("playerMove", (rawPlayer, oldChannelId, newChannelId) => {
            const compatPlayer = this.players.get(rawPlayer.guildId);
            if (!compatPlayer) return;
            if (newChannelId) compatPlayer.voiceChannel = newChannelId;
            this.emit("playerMove", compatPlayer, oldChannelId, newChannelId);
        });

        this._events = new Map();
    }

    on(eventName, handler) {
        if (!this._events.has(eventName)) this._events.set(eventName, []);
        this._events.get(eventName).push(handler);
        return this;
    }

    emit(eventName, ...args) {
        const handlers = this._events.get(eventName);
        if (!handlers) return;
        for (const fn of handlers) {
            try {
                fn(...args);
            } catch (e) {
                console.error(e);
            }
        }
    }

    async init(clientUserId) {
        await this._ll.init({ id: clientUserId, username: this.client.user?.username });
    }

    updateVoiceState(packet) {
        this._ll.sendRawData(packet);
    }

    async create(options) {
        const existing = this.players.get(options.guild);
        if (existing) return existing;
        const player = new CompatPlayer(this, options.guild, options);
        this.players.set(options.guild, player);
        this.emit("playerCreate", player);
        return player;
    }

    async search(query, requester) {
        const q = typeof query === "string" ? query : query.query;
        const source = typeof query === "string" ? undefined : query.source;
        // Map erela.js-style source names to Lavalink v4 REST search prefixes.
        // erela used "youtube" / "soundcloud"; Lavalink v4 needs "ytsearch:", "scsearch:", etc.
        const SOURCE_MAP = {
            youtube: "ytsearch",
            soundcloud: "scsearch",
            "youtube music": "ytmsearch",
            youtubemusic: "ytmsearch",
            ytm: "ytmsearch",
            yt: "ytsearch",
            sc: "scsearch",
        };
        const prefix = source ? (SOURCE_MAP[source.toLowerCase()] ?? source) : null;
        // URLs are passed as-is; text queries get the search prefix prepended.
        // If no source is given, fall back to "ytsearch" so Lavalink knows which
        // platform to search — without a prefix, Lavalink treats the string as a URL
        // and returns empty results for plain song name queries.
        const DEFAULT_PREFIX = "ytsearch";
        const isUrl = /^https?:\/\//.test(q);
        const finalQuery = isUrl ? q : `${prefix ?? DEFAULT_PREFIX}:${q}`;

        // Use the first connected node's rawRequest() — this uses the library's own HTTP
        // client with correct host/port/auth/version path, no node.info validation needed.
        const node = [...this._ll.nodeManager.nodes.values()].find(n => n.connected);
        if (!node) {
            console.error("[CompatManager.search] No connected Lavalink node!");
            return {
                loadType: "LOAD_FAILED",
                tracks: [],
                playlist: null,
                exception: { message: "No connected Lavalink node available." },
            };
        }

        let result;
        try {
            const { response } = await node.rawRequest(
                `/loadtracks?identifier=${encodeURIComponent(finalQuery)}`
            );
            if (!response.ok) {
                const text = await response.text().catch(() => "");
                console.error(`[CompatManager.search] Lavalink REST ${response.status}: ${text}`);
                return {
                    loadType: "LOAD_FAILED",
                    tracks: [],
                    playlist: null,
                    exception: {
                        message: `Lavalink REST error ${response.status}${text ? `: ${text}` : ""}`,
                    },
                };
            }
            result = await response.json();
        } catch (err) {
            console.error("[CompatManager.search] rawRequest error:", err?.message || err);
            return {
                loadType: "LOAD_FAILED",
                tracks: [],
                playlist: null,
                exception: { message: err?.message || "Failed to reach Lavalink." },
            };
        }

        // Parse Lavalink v4 raw response format.
        const loadTypeRaw = result?.loadType; // "search"|"track"|"playlist"|"empty"|"error"

        // Extract raw track objects based on loadType.
        let rawTracks = [];
        if (loadTypeRaw === "search" && Array.isArray(result.data)) {
            rawTracks = result.data;
        } else if (loadTypeRaw === "track" && result.data && !Array.isArray(result.data)) {
            rawTracks = [result.data];
        } else if (loadTypeRaw === "playlist" && Array.isArray(result.data?.tracks)) {
            rawTracks = result.data.tracks;
        }

        // Flatten raw Lavalink track objects to erela.js-compatible flat format.
        const tracks = rawTracks.map(t => ({
            title: t.info?.title,
            author: t.info?.author,
            duration: t.info?.length ?? t.info?.duration,
            identifier: t.info?.identifier,
            isStream: t.info?.isStream,
            uri: t.info?.uri,
            thumbnail: t.info?.artworkUrl,
            encoded: t.encoded,
            track: t.encoded,
            encodedTrack: t.encoded,
            requester,
        }));

        let loadType = "SEARCH_RESULT";
        if (loadTypeRaw === "error") loadType = "LOAD_FAILED";
        else if (loadTypeRaw === "playlist") loadType = "PLAYLIST_LOADED";
        else if (loadTypeRaw === "empty" || !tracks.length) loadType = "NO_MATCHES";
        else if (loadTypeRaw === "track") loadType = "TRACK_LOADED";
        // "search" → "SEARCH_RESULT" (default)

        return {
            loadType,
            tracks,
            playlist:
                loadType === "PLAYLIST_LOADED" && result.data?.info
                    ? {
                          name: result.data.info.name || "Playlist",
                          duration: tracks.reduce((a, b) => a + (b.duration || 0), 0),
                          uri: tracks[0]?.uri || null,
                      }
                    : null,
            exception:
                loadType === "LOAD_FAILED"
                    ? {
                          message:
                              result.data?.message ||
                              result.exception?.message ||
                              "Lavalink returned a load failure for this query.",
                      }
                    : null,
        };
    }
}

module.exports = { CompatManager };
