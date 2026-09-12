import { state } from "./state.js";
import { showToast } from "./components.js";

class YouTubePlayerService {
  constructor() {
    this.player = null;
    this.isReady = false;
    this.currentVideoId = null;
    this.pollInterval = null;
    this.onEndedCallback = null;
    this.loadPromise = null;
    this.playerPromise = null;
    this.pendingPlay = null;

    // Start loading the IFrame API immediately. The player is also created as
    // soon as the API is ready, so a later user click can call playVideo()
    // without waiting for an asynchronous player initialization step.
    this.preload();
  }

  preload() {
    this.ensurePlayer().catch((error) => {
      console.warn("YouTube player preload failed:", error);
    });
  }

  loadIFrameAPI() {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        this.isReady = true;
        resolve(window.YT);
        return;
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      const timeout = window.setTimeout(() => {
        reject(new Error("YouTube IFrame API timed out"));
      }, 15000);

      window.onYouTubeIframeAPIReady = () => {
        window.clearTimeout(timeout);
        if (typeof previousCallback === "function") previousCallback();
        this.isReady = true;
        resolve(window.YT);
      };

      if (!document.getElementById("youtube-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error("Unable to load YouTube IFrame API"));
        };
        const firstScriptTag = document.getElementsByTagName("script")[0];
        if (firstScriptTag?.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }
    });

    return this.loadPromise;
  }

  async ensurePlayer() {
    await this.loadIFrameAPI();

    if (this.player && typeof this.player.playVideo === "function") {
      return this.player;
    }

    if (this.playerPromise) return this.playerPromise;

    this.playerPromise = new Promise((resolve, reject) => {
      let mount = document.getElementById("youtube-player-mount");
      if (!mount) {
        const container = document.getElementById("youtube-player-container") || document.body;
        mount = document.createElement("div");
        mount.id = "youtube-player-mount";
        container.appendChild(mount);
      }

      try {
        this.player = new window.YT.Player("youtube-player-mount", {
          height: "90",
          width: "160",
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin
          },
          events: {
            onReady: () => {
              this.isReady = true;
              try {
                this.player.setVolume(Math.round((state.volume ?? 0.85) * 100));
                if (state.isMuted) this.player.mute();
              } catch (error) {
                console.warn("YouTube initial volume setup failed:", error);
              }

              const iframe = mount.querySelector("iframe");
              if (iframe) {
                iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
                iframe.setAttribute("title", "YouTube audio player");
              }

              resolve(this.player);

              // If the first user click happened before the player was ready,
              // finish that requested load now. Browsers may still require a
              // second click if the gesture was already lost, so we do not
              // pretend that autoplay was guaranteed.
              if (this.pendingPlay) {
                const pending = this.pendingPlay;
                this.pendingPlay = null;
                this.loadAndPlay(pending.song, pending.startTime);
              }
            },
            onStateChange: (event) => {
              this.handleStateChange(event.data);
            },
            onError: (event) => {
              console.warn("YouTube Player error:", event.data);
              this.pendingPlay = null;

              const messages = {
                2: "YouTube playback request is invalid.",
                5: "This YouTube video cannot be played in the HTML5 player.",
                100: "This YouTube video is unavailable or private.",
                101: "This video does not allow playback in embedded players.",
                150: "This video does not allow playback in embedded players."
              };

              showToast(messages[event.data] || "YouTube video could not be played.");
              if (typeof this.onEndedCallback === "function") {
                setTimeout(() => this.onEndedCallback(), 800);
              }
            },
            onPlaybackQualityChange: () => {}
          }
        });
      } catch (error) {
        this.playerPromise = null;
        reject(error);
      }
    });

    return this.playerPromise;
  }

  handleStateChange(playerState) {
    const YTState = window.YT?.PlayerState || {
      ENDED: 0,
      PLAYING: 1,
      PAUSED: 2,
      BUFFERING: 3,
      CUED: 5
    };

    if (playerState === YTState.PLAYING) {
      state.isPlaying = true;
      state.notify("playbackStateChanged", true);
      this.startProgressPolling();
    } else if (playerState === YTState.PAUSED) {
      state.isPlaying = false;
      state.notify("playbackStateChanged", false);
      this.stopProgressPolling();
    } else if (playerState === YTState.ENDED) {
      state.isPlaying = false;
      this.stopProgressPolling();
      if (typeof this.onEndedCallback === "function") this.onEndedCallback();
    } else if (playerState === YTState.BUFFERING) {
      // Keep the logical play state while YouTube buffers.
      state.isPlaying = true;
      state.notify("playbackStateChanged", true);
    }
  }

  startProgressPolling() {
    this.stopProgressPolling();
    this.pollInterval = window.setInterval(() => {
      if (!this.player || typeof this.player.getCurrentTime !== "function") return;
      try {
        const current = Number(this.player.getCurrentTime()) || 0;
        const duration = Number(this.player.getDuration()) || state.duration || 0;

        if (duration > 0 && Math.abs(duration - state.duration) > 0.5) {
          state.duration = duration;
          if (state.currentSong) state.currentSong.duration = Math.round(duration);
        }

        state.currentTime = current;
        state.notify("timeUpdate", {
          currentTime: current,
          duration: state.duration
        });
      } catch (error) {
        // The iframe may temporarily be unavailable while navigating.
      }
    }, 250);
  }

  stopProgressPolling() {
    if (this.pollInterval) {
      window.clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  loadAndPlay(song, startTime = 0) {
    const videoId = song?.youtubeId || (song?.id ? song.id.replace(/^youtube:/, "") : null);
    if (!videoId || !this.player) return false;

    this.currentVideoId = videoId;
    const safeStart = Math.max(0, Number(startTime) || 0);

    try {
      this.player.loadVideoById({
        videoId,
        startSeconds: safeStart
      });
      this.player.setVolume(Math.round((state.isMuted ? 0 : (state.volume ?? 0.85)) * 100));
      if (state.isMuted) this.player.mute();
      else this.player.unMute();
      this.player.playVideo();
      return true;
    } catch (error) {
      console.warn("YouTube play error:", error);
      showToast("YouTube playback could not be started.");
      return false;
    }
  }

  async play(song, startTime = 0) {
    const videoId = song?.youtubeId || (song?.id ? song.id.replace(/^youtube:/, "") : null);
    if (!videoId) return false;

    // Fast path: when the player has already been preloaded, playVideo() is
    // called directly from the current UI action instead of after an await.
    if (this.player && typeof this.player.playVideo === "function" && this.isReady) {
      return this.loadAndPlay(song, startTime);
    }

    // First-load path. Queue the request while the player is initialized.
    this.pendingPlay = { song, startTime };
    try {
      await this.ensurePlayer();
      if (this.pendingPlay?.song === song) {
        const pending = this.pendingPlay;
        this.pendingPlay = null;
        return this.loadAndPlay(pending.song, pending.startTime);
      }
      return true;
    } catch (error) {
      this.pendingPlay = null;
      console.warn("YouTube player initialization failed:", error);
      showToast("YouTube player could not be initialized. Check your internet connection.");
      return false;
    }
  }

  pause() {
    if (this.player && typeof this.player.pauseVideo === "function") {
      try {
        this.player.pauseVideo();
      } catch (error) {}
    }
    this.stopProgressPolling();
  }

  resume() {
    if (this.player && typeof this.player.playVideo === "function") {
      try {
        this.player.playVideo();
      } catch (error) {}
    }
  }

  seek(seconds) {
    if (this.player && typeof this.player.seekTo === "function") {
      try {
        const duration = Number(this.player.getDuration?.()) || state.duration || 0;
        const target = Math.max(0, duration > 0 ? Math.min(Number(seconds) || 0, duration) : Number(seconds) || 0);
        this.player.seekTo(target, true);
        state.currentTime = target;
        state.notify("timeUpdate", {
          currentTime: target,
          duration: state.duration
        });
      } catch (error) {}
    }
  }

  setVolume(volFraction) {
    const volume = Math.max(0, Math.min(1, Number(volFraction) || 0));
    if (this.player && typeof this.player.setVolume === "function") {
      try {
        this.player.setVolume(Math.round(volume * 100));
        if (volume === 0) this.player.mute();
        else this.player.unMute();
      } catch (error) {}
    }
  }

  setPlaybackRate(rate) {
    if (this.player && typeof this.player.setPlaybackRate === "function") {
      try {
        this.player.setPlaybackRate(Number(rate) || 1);
      } catch (error) {}
    }
  }

  setOnEnded(callback) {
    this.onEndedCallback = callback;
  }
}

export const youtubePlayer = new YouTubePlayerService();

export async function searchYouTubeTracks(query, maxResults = 12, pageToken = "") {
  try {
    let url = `/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.message || data?.error || `YouTube API error: ${res.status}`);
    }

    return data;
  } catch (err) {
    console.warn("YouTube search query error:", err);
    throw err;
  }
}
