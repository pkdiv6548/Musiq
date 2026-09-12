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
  }

  loadIFrameAPI() {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        this.isReady = true;
        resolve(window.YT);
        return;
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === "function") prevCallback();
        this.isReady = true;
        resolve(window.YT);
      };

      if (!document.getElementById("youtube-iframe-api-script")) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-api-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }
    });

    return this.loadPromise;
  }

  async ensurePlayer() {
    await this.loadIFrameAPI();

    return new Promise((resolve) => {
      if (this.player && typeof this.player.playVideo === "function") {
        resolve(this.player);
        return;
      }

      let mount = document.getElementById("youtube-player-mount");
      if (!mount) {
        const container = document.getElementById("youtube-player-container") || document.body;
        mount = document.createElement("div");
        mount.id = "youtube-player-mount";
        container.appendChild(mount);
      }

      this.player = new window.YT.Player("youtube-player-mount", {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin
        },
        events: {
          onReady: () => {
            this.isReady = true;
            // Set initial volume
            try {
              this.player.setVolume(Math.round((state.volume || 0.85) * 100));
            } catch (e) {}
            resolve(this.player);
          },
          onStateChange: (event) => {
            this.handleStateChange(event.data);
          },
          onError: (event) => {
            console.warn("YouTube Player encountered error:", event.data);
            showToast("YouTube video unavailable. Playing next track...");
            if (typeof this.onEndedCallback === "function") {
              setTimeout(() => this.onEndedCallback(), 1000);
            }
          }
        }
      });
    });
  }

  handleStateChange(playerState) {
    const YTState = window.YT ? window.YT.PlayerState : {
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
      if (typeof this.onEndedCallback === "function") {
        this.onEndedCallback();
      }
    }
  }

  startProgressPolling() {
    this.stopProgressPolling();
    this.pollInterval = setInterval(() => {
      if (!this.player || typeof this.player.getCurrentTime !== "function") return;
      try {
        const current = this.player.getCurrentTime() || 0;
        const duration = this.player.getDuration() || state.duration || 0;

        if (duration > 0 && duration !== state.duration) {
          state.duration = duration;
          if (state.currentSong) state.currentSong.duration = Math.round(duration);
        }

        state.currentTime = current;
        state.notify("timeUpdate", {
          currentTime: current,
          duration: state.duration
        });
      } catch (e) {}
    }, 250);
  }

  stopProgressPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async play(song, startTime = 0) {
    const videoId = song.youtubeId || (song.id ? song.id.replace(/^youtube:/, "") : null);
    if (!videoId) return;

    await this.ensurePlayer();

    this.currentVideoId = videoId;
    try {
      this.player.loadVideoById({
        videoId: videoId,
        startSeconds: startTime
      });
      this.player.setVolume(Math.round((state.isMuted ? 0 : state.volume) * 100));
      this.player.playVideo();
    } catch (e) {
      console.warn("YouTube play error", e);
    }
  }

  pause() {
    if (this.player && typeof this.player.pauseVideo === "function") {
      try {
        this.player.pauseVideo();
      } catch (e) {}
    }
    this.stopProgressPolling();
  }

  resume() {
    if (this.player && typeof this.player.playVideo === "function") {
      try {
        this.player.playVideo();
      } catch (e) {}
    }
  }

  seek(seconds) {
    if (this.player && typeof this.player.seekTo === "function") {
      try {
        this.player.seekTo(seconds, true);
        state.currentTime = seconds;
        state.notify("timeUpdate", {
          currentTime: seconds,
          duration: state.duration
        });
      } catch (e) {}
    }
  }

  setVolume(volFraction) {
    if (this.player && typeof this.player.setVolume === "function") {
      try {
        this.player.setVolume(Math.round(volFraction * 100));
        if (volFraction === 0) {
          this.player.mute();
        } else {
          this.player.unMute();
        }
      } catch (e) {}
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
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`YouTube API error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("YouTube search query error:", err);
    throw err;
  }
}
