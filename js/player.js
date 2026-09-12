import { state } from "./state.js";
import { audioEngine } from "./audio-engine.js";
import { ICONS, formatTime, showToast, openModal, closeModal } from "./components.js";
import { lyricsService } from "./lyrics.js";

export class PlayerController {
  constructor() {
    this.isDraggingSeek = false;
    this.eqAnimFrame = null;
    this.initDOM();
    this.bindEvents();
    this.bindSubscriptions();
  }

  initDOM() {
    this.playBtn = document.getElementById("player-play-btn");
    this.prevBtn = document.getElementById("player-prev-btn");
    this.nextBtn = document.getElementById("player-next-btn");
    this.shuffleBtn = document.getElementById("player-shuffle-btn");
    this.repeatBtn = document.getElementById("player-repeat-btn");
    this.favBtn = document.getElementById("player-fav-btn");

    this.seekSlider = document.getElementById("seek-slider");
    this.seekFill = document.getElementById("seek-fill");
    this.seekThumb = document.getElementById("seek-thumb");
    this.timeCurrent = document.getElementById("time-current");
    this.timeDuration = document.getElementById("time-duration");

    this.volumeBtn = document.getElementById("player-vol-btn");
    this.volumeSlider = document.getElementById("volume-slider");
    this.volumeFill = document.getElementById("volume-fill");

    this.thumbImg = document.getElementById("player-thumb");
    this.titleEl = document.getElementById("player-title");
    this.artistEl = document.getElementById("player-artist");
    this.badgesEl = document.getElementById("player-badges");

    // Mobile controls & progress
    this.mobilePlayBtn = document.getElementById("mobile-play-btn");
    this.mobileNextBtn = document.getElementById("mobile-next-btn");
    this.mobileProgressFill = document.getElementById("mobile-progress-fill");
    this.playerLeftBox = document.getElementById("player-left-box");

    // Fullscreen elements
    this.fsModal = document.getElementById("fullscreen-player-modal");
    this.fsBackdrop = document.getElementById("fs-backdrop-blur");
    this.fsMainBody = document.getElementById("fs-main-body");
    this.fsArtwork = document.getElementById("fs-artwork-img");
    this.fsArtworkCard = document.getElementById("fs-artwork-card");
    this.fsTitle = document.getElementById("fs-title");
    this.fsArtist = document.getElementById("fs-artist");
    this.fsPlayBtn = document.getElementById("fs-play-btn");
    this.fsPrevBtn = document.getElementById("fs-prev-btn");
    this.fsNextBtn = document.getElementById("fs-next-btn");
    this.fsShuffleBtn = document.getElementById("fs-shuffle-btn");
    this.fsRepeatBtn = document.getElementById("fs-repeat-btn");
    this.fsFavBtn = document.getElementById("fs-fav-btn");
    this.fsCloseBtn = document.getElementById("fs-close-btn");

    // Fullscreen seeker
    this.fsSeekSlider = document.getElementById("fs-seek-slider");
    this.fsSeekFill = document.getElementById("fs-seek-fill");
    this.fsSeekThumb = document.getElementById("fs-seek-thumb");
    this.fsTimeCurrent = document.getElementById("fs-time-current");
    this.fsTimeDuration = document.getElementById("fs-time-duration");

    // View Switchers
    this.fsSwitchPlayer = document.getElementById("fs-switch-player");
    this.fsSwitchLyrics = document.getElementById("fs-switch-lyrics");
    this.fsToggleLyricsBtn = document.getElementById("fs-toggle-lyrics-btn");
    this.fsBackToArtBtn = document.getElementById("fs-back-to-art-btn");
    this.fsEqBtn = document.getElementById("fs-eq-btn");

    // Lyrics panel elements
    this.fsLyricsSongTitle = document.getElementById("fs-lyrics-song-title");
    this.fsLyricsSongArtist = document.getElementById("fs-lyrics-song-artist");
    this.fsLyricsBarTitle = document.getElementById("fs-lyrics-bar-title");
    this.fsLyricsPlayBtn = document.getElementById("fs-lyrics-play-btn");
    this.fsLyricsPrevBtn = document.getElementById("fs-lyrics-prev-btn");
    this.fsLyricsNextBtn = document.getElementById("fs-lyrics-next-btn");
    this.fsLyricsProgressFill = document.getElementById("fs-lyrics-progress-fill");

    // Spotify Equalizer Animation references
    this.appPlayerBar = document.getElementById("app-player-bar");
    this.playerBarSpotifyEq = document.getElementById("player-bar-spotify-eq");
    this.playerBarEqBars = document.getElementById("player-bar-eq-bars");
    this.playerBarEqText = document.getElementById("player-bar-eq-text");
    this.playerThumbEqBars = document.getElementById("player-thumb-eq-bars");
    this.fsSpotifyEqBadge = document.getElementById("fs-spotify-eq-badge");
    this.fsPlayerEqBars = document.getElementById("fs-player-eq-bars");
    this.fsPlayerEqStatus = document.getElementById("fs-player-eq-status");
    this.fsPlayerEqFormat = document.getElementById("fs-player-eq-format");
    this.fsArtEqBars = document.getElementById("fs-art-eq-bars");
  }

  bindEvents() {
    // Play/Pause toggles
    this.playBtn?.addEventListener("click", () => this.togglePlay());
    this.fsPlayBtn?.addEventListener("click", () => this.togglePlay());
    this.fsLyricsPlayBtn?.addEventListener("click", () => this.togglePlay());
    this.mobilePlayBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.togglePlay();
    });

    // Next / Prev
    this.nextBtn?.addEventListener("click", () => audioEngine.nextTrack());
    this.prevBtn?.addEventListener("click", () => audioEngine.prevTrack());
    this.fsNextBtn?.addEventListener("click", () => audioEngine.nextTrack());
    this.fsPrevBtn?.addEventListener("click", () => audioEngine.prevTrack());
    this.fsLyricsNextBtn?.addEventListener("click", () => audioEngine.nextTrack());
    this.fsLyricsPrevBtn?.addEventListener("click", () => audioEngine.prevTrack());
    this.mobileNextBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      audioEngine.nextTrack();
    });

    // Tap on mini player left area opens fullscreen player (especially on mobile)
    this.playerLeftBox?.addEventListener("click", (e) => {
      if (e.target.closest("#player-fav-btn")) return;
      this.openFullscreenPlayer();
    });

    // Shuffle
    const toggleShuffle = () => {
      state.shuffle = !state.shuffle;
      this.shuffleBtn?.classList.toggle("active", state.shuffle);
      this.fsShuffleBtn?.classList.toggle("active", state.shuffle);
      showToast(state.shuffle ? "Shuffle turned ON" : "Shuffle turned OFF");
    };
    this.shuffleBtn?.addEventListener("click", toggleShuffle);
    this.fsShuffleBtn?.addEventListener("click", toggleShuffle);

    // Repeat
    const cycleRepeat = () => {
      if (state.repeatMode === "off") {
        state.repeatMode = "all";
        const icon = ICONS.repeat;
        if (this.repeatBtn) { this.repeatBtn.innerHTML = icon; this.repeatBtn.classList.add("active"); }
        if (this.fsRepeatBtn) { this.fsRepeatBtn.innerHTML = icon; this.fsRepeatBtn.classList.add("active"); }
        showToast("Repeat All active");
      } else if (state.repeatMode === "all") {
        state.repeatMode = "one";
        const icon = ICONS.repeatOne;
        if (this.repeatBtn) { this.repeatBtn.innerHTML = icon; this.repeatBtn.classList.add("active"); }
        if (this.fsRepeatBtn) { this.fsRepeatBtn.innerHTML = icon; this.fsRepeatBtn.classList.add("active"); }
        showToast("Repeat One active");
      } else {
        state.repeatMode = "off";
        const icon = ICONS.repeat;
        if (this.repeatBtn) { this.repeatBtn.innerHTML = icon; this.repeatBtn.classList.remove("active"); }
        if (this.fsRepeatBtn) { this.fsRepeatBtn.innerHTML = icon; this.fsRepeatBtn.classList.remove("active"); }
        showToast("Repeat OFF");
      }
    };
    this.repeatBtn?.addEventListener("click", cycleRepeat);
    this.fsRepeatBtn?.addEventListener("click", cycleRepeat);

    // Favorite toggle
    const toggleFav = () => {
      if (state.currentSong) {
        const isFav = state.toggleFavorite(state.currentSong.id);
        const icon = isFav ? ICONS.heartFilled : ICONS.heart;
        if (this.favBtn) this.favBtn.innerHTML = icon;
        if (this.fsFavBtn) this.fsFavBtn.innerHTML = icon;
        showToast(isFav ? "Saved to Favorites" : "Removed from Favorites");
      }
    };
    this.favBtn?.addEventListener("click", toggleFav);
    this.fsFavBtn?.addEventListener("click", toggleFav);

    // View Switching in Fullscreen (Player vs Lyrics)
    this.fsSwitchPlayer?.addEventListener("click", () => this.setFullscreenView("player"));
    this.fsSwitchLyrics?.addEventListener("click", () => this.setFullscreenView("lyrics"));
    this.fsToggleLyricsBtn?.addEventListener("click", () => this.setFullscreenView("lyrics"));
    this.fsBackToArtBtn?.addEventListener("click", () => this.setFullscreenView("player"));
    this.fsArtworkCard?.addEventListener("click", () => this.setFullscreenView("lyrics"));

    // Fullscreen Equalizer Shortcut
    this.fsEqBtn?.addEventListener("click", () => {
      this.closeFullscreenPlayer();
      window.location.hash = "#/equalizer";
    });

    // Main Seek interaction
    if (this.seekSlider) {
      const handleSeek = (e) => {
        const rect = this.seekSlider.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clickX = clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = pct * state.duration;
        audioEngine.seek(newTime);
      };

      this.seekSlider.addEventListener("click", handleSeek);

      this.seekSlider.addEventListener("mousedown", (e) => {
        this.isDraggingSeek = true;
        this.seekSlider.classList.add("is-dragging");
        handleSeek(e);

        const onMouseMove = (moveEv) => {
          if (this.isDraggingSeek) handleSeek(moveEv);
        };
        const onMouseUp = () => {
          this.isDraggingSeek = false;
          this.seekSlider.classList.remove("is-dragging");
          window.removeEventListener("mousemove", onMouseMove);
          window.removeEventListener("mouseup", onMouseUp);
        };
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
      });
    }

    // Fullscreen Seek interaction
    if (this.fsSeekSlider) {
      const handleFsSeek = (e) => {
        const rect = this.fsSeekSlider.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clickX = clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        const newTime = pct * state.duration;
        audioEngine.seek(newTime);
      };

      this.fsSeekSlider.addEventListener("click", handleFsSeek);

      this.fsSeekSlider.addEventListener("mousedown", (e) => {
        this.isDraggingSeek = true;
        this.fsSeekSlider.classList.add("is-dragging");
        handleFsSeek(e);

        const onFsMove = (moveEv) => {
          if (this.isDraggingSeek) handleFsSeek(moveEv);
        };
        const onFsUp = () => {
          this.isDraggingSeek = false;
          this.fsSeekSlider.classList.remove("is-dragging");
          window.removeEventListener("mousemove", onFsMove);
          window.removeEventListener("mouseup", onFsUp);
        };
        window.addEventListener("mousemove", onFsMove);
        window.addEventListener("mouseup", onFsUp);
      });

      this.fsSeekSlider.addEventListener("touchstart", (e) => {
        this.isDraggingSeek = true;
        this.fsSeekSlider.classList.add("is-dragging");
        handleFsSeek(e);
      }, { passive: true });

      this.fsSeekSlider.addEventListener("touchmove", (e) => {
        if (this.isDraggingSeek) handleFsSeek(e);
      }, { passive: true });

      this.fsSeekSlider.addEventListener("touchend", () => {
        this.isDraggingSeek = false;
        this.fsSeekSlider.classList.remove("is-dragging");
      });
    }

    // Volume Slider
    if (this.volumeSlider) {
      const handleVol = (e) => {
        const rect = this.volumeSlider.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const pct = Math.max(0, Math.min(1, clickX / rect.width));
        audioEngine.setVolume(pct);
      };
      this.volumeSlider.addEventListener("click", handleVol);
    }

    // Volume Mute
    this.volumeBtn?.addEventListener("click", () => {
      audioEngine.toggleMute();
    });

    // Fullscreen player open/close
    document.getElementById("player-expand-btn")?.addEventListener("click", () => {
      this.openFullscreenPlayer();
    });
    this.thumbImg?.parentElement?.addEventListener("click", () => {
      this.openFullscreenPlayer();
    });
    this.fsCloseBtn?.addEventListener("click", () => {
      this.closeFullscreenPlayer();
    });

    // Header / Bar shortcuts: Equalizer, Visualizer, Lyrics, Sleep Timer
    document.getElementById("player-eq-btn")?.addEventListener("click", () => {
      window.location.hash = "#/equalizer";
    });
    document.getElementById("player-vis-btn")?.addEventListener("click", () => {
      window.location.hash = "#/visualizer";
    });
    document.getElementById("player-lyrics-btn")?.addEventListener("click", () => {
      window.location.hash = "#/lyrics";
    });
    document.getElementById("player-queue-btn")?.addEventListener("click", () => {
      this.toggleRightPanel("queue");
    });
    document.getElementById("player-timer-btn")?.addEventListener("click", () => {
      this.openSleepTimerModal();
    });
    document.getElementById("player-quality-btn")?.addEventListener("click", () => {
      this.openQualityModal();
    });
  }

  bindSubscriptions() {
    state.subscribe("songChanged", (song) => this.renderSong(song));
    state.subscribe("playbackStateChanged", (isPlaying) => this.renderPlaybackState(isPlaying));
    state.subscribe("timeUpdate", (data) => this.renderTime(data));
    state.subscribe("volumeChanged", (data) => this.renderVolume(data));
    state.subscribe("favoritesChanged", ({ songId, isFavorite }) => {
      if (state.currentSong && state.currentSong.id === songId) {
        if (this.favBtn) this.favBtn.innerHTML = isFavorite ? ICONS.heartFilled : ICONS.heart;
      }
    });

    if (state.currentSong) {
      this.renderSong(state.currentSong);
    }
  }

  togglePlay() {
    if (state.isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
  }

  renderSong(song) {
    if (!song) return;
    if (this.thumbImg) this.thumbImg.src = song.artwork;
    if (this.titleEl) this.titleEl.textContent = song.title;
    if (this.artistEl) this.artistEl.textContent = song.artist;

    if (this.badgesEl) {
      const isYouTube = song.source === "youtube" || (song.id && song.id.startsWith("youtube:"));
      const isLocal = song.source === "local" || (song.id && song.id.startsWith("local:"));
      let sourceBadge = `<span class="badge-pill">${song.format || "MP3"}</span>`;
      if (isYouTube) {
        sourceBadge = `<span class="badge-pill" style="background:rgba(255,0,0,0.18);color:#ff4b4b;border:1px solid rgba(255,0,0,0.3);"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="display:inline;margin-right:3px;vertical-align:-1px;"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>YouTube</span>`;
      } else if (isLocal) {
        sourceBadge = `<span class="badge-pill" style="background:rgba(0,180,255,0.16);color:#38bdf8;border:1px solid rgba(0,180,255,0.25);"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;margin-right:3px;vertical-align:-1px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>Local</span>`;
      }

      this.badgesEl.innerHTML = `
        ${sourceBadge}
        <span class="badge-pill">${song.bitrate || "320k"}</span>
        ${song.isHiRes ? `<span class="badge-pill" style="color:#d4af37;background:rgba(212,175,55,0.15)">Hi-Res</span>` : ""}
      `;
    }

    if (this.favBtn) {
      this.favBtn.innerHTML = state.isFavorite(song.id) ? ICONS.heartFilled : ICONS.heart;
    }
    if (this.fsFavBtn) {
      this.fsFavBtn.innerHTML = state.isFavorite(song.id) ? ICONS.heartFilled : ICONS.heart;
    }

    // Fullscreen updates
    if (this.fsArtwork) this.fsArtwork.src = song.artwork;
    if (this.fsBackdrop) this.fsBackdrop.style.backgroundImage = `url('${song.artwork}')`;
    if (this.fsTitle) this.fsTitle.textContent = song.title;
    if (this.fsArtist) this.fsArtist.textContent = song.artist;

    if (this.fsLyricsSongTitle) this.fsLyricsSongTitle.textContent = song.title;
    if (this.fsLyricsSongArtist) this.fsLyricsSongArtist.textContent = song.artist;
    if (this.fsLyricsBarTitle) this.fsLyricsBarTitle.textContent = `${song.title} • ${song.artist}`;

    if (this.fsPlayerEqFormat) {
      this.fsPlayerEqFormat.textContent = `${song.bitrate || "320K"} • ${song.format || (song.isHiRes ? "HI-RES" : "AUDIO")}`;
    }

    // Render lyrics if fullscreen is currently displaying lyrics
    const lyricsContainer = document.getElementById("fs-lyrics-display");
    if (lyricsContainer && this.fsModal?.classList.contains("open")) {
      lyricsService.renderToContainer(lyricsContainer, song.id);
    }
  }

  renderPlaybackState(isPlaying) {
    const playIcon = isPlaying ? ICONS.pause : ICONS.play;
    if (this.playBtn) this.playBtn.innerHTML = playIcon;
    if (this.fsPlayBtn) this.fsPlayBtn.innerHTML = playIcon;
    if (this.fsLyricsPlayBtn) this.fsLyricsPlayBtn.innerHTML = playIcon;
    if (this.mobilePlayBtn) this.mobilePlayBtn.innerHTML = playIcon;

    if (this.fsArtworkCard) {
      this.fsArtworkCard.classList.toggle("playing", isPlaying);
    }

    // Toggle container playback classes
    this.appPlayerBar?.classList.toggle("is-playing", isPlaying);
    this.appPlayerBar?.classList.toggle("is-paused", !isPlaying);
    this.fsModal?.classList.toggle("is-playing", isPlaying);
    this.fsModal?.classList.toggle("is-paused", !isPlaying);

    // Toggle equalizer animation classes across all Spotify equalizer bars
    const allEqBars = document.querySelectorAll(".spotify-eq-bars");
    allEqBars.forEach(el => {
      el.classList.toggle("is-playing", isPlaying);
      el.classList.toggle("is-paused", !isPlaying);
    });

    // Update player bar pill status
    if (this.playerBarSpotifyEq) {
      this.playerBarSpotifyEq.classList.toggle("is-paused", !isPlaying);
    }
    if (this.playerBarEqText) {
      this.playerBarEqText.textContent = isPlaying ? "PLAYING" : "PAUSED";
    }

    // Update fullscreen player badge status
    if (this.fsSpotifyEqBadge) {
      this.fsSpotifyEqBadge.classList.toggle("is-paused", !isPlaying);
    }
    if (this.fsPlayerEqStatus) {
      this.fsPlayerEqStatus.textContent = isPlaying ? "NOW PLAYING" : "PAUSED";
    }

    // Dynamic seek bar glow & fill effect
    this.seekFill?.classList.toggle("spotify-active-bar", isPlaying);
    this.fsSeekFill?.classList.toggle("spotify-active-bar", isPlaying);

    // Update equalizer bar animation (audio-reactive or CSS animation)
    this.updateEqualizerAnimation(isPlaying);

    // Update active playlist/table song row equalizer if visible
    const currentActiveRow = document.querySelector(".song-row.is-active .song-num-label");
    if (currentActiveRow) {
      currentActiveRow.innerHTML = `
        <div class="spotify-eq-bars mini ${isPlaying ? 'is-playing' : 'is-paused'}" title="${isPlaying ? 'Playing' : 'Paused'}">
          <span class="spotify-eq-bar bar-1"></span>
          <span class="spotify-eq-bar bar-2"></span>
          <span class="spotify-eq-bar bar-3"></span>
          <span class="spotify-eq-bar bar-4"></span>
        </div>
      `;
    }
  }

  updateEqualizerAnimation(isPlaying) {
    if (this.eqAnimFrame) {
      cancelAnimationFrame(this.eqAnimFrame);
      this.eqAnimFrame = null;
    }

    if (!isPlaying) {
      const allBars = document.querySelectorAll(".spotify-eq-bar");
      allBars.forEach(bar => {
        bar.style.transform = "";
      });
      document.querySelectorAll(".spotify-eq-bars.audio-reactive").forEach(el => {
        el.classList.remove("audio-reactive");
      });
      return;
    }

    // Connect Web Audio Analyser if available in audio engine
    const analyser = audioEngine?.analyser;
    if (!analyser) return;

    let dataArray;
    try {
      dataArray = new Uint8Array(analyser.frequencyBinCount || 64);
    } catch (e) {
      return;
    }

    const tick = () => {
      if (!state.isPlaying) return;

      try {
        analyser.getByteFrequencyData(dataArray);

        let energySum = 0;
        for (let i = 0; i < 20; i++) {
          energySum += dataArray[i];
        }
        const avgEnergy = energySum / 20;

        if (avgEnergy > 8) {
          // Audio-reactive frequency modulation
          document.querySelectorAll(".spotify-eq-bars").forEach(el => {
            if (!el.classList.contains("audio-reactive")) el.classList.add("audio-reactive");
          });

          const bar1Scale = Math.min(1, Math.max(0.2, (dataArray[2] || 0) / 210));
          const bar2Scale = Math.min(1, Math.max(0.28, (dataArray[5] || 0) / 195));
          const bar3Scale = Math.min(1, Math.max(0.22, (dataArray[9] || 0) / 180));
          const bar4Scale = Math.min(1, Math.max(0.25, (dataArray[14] || 0) / 165));

          const bar1Els = document.querySelectorAll(".spotify-eq-bar.bar-1");
          const bar2Els = document.querySelectorAll(".spotify-eq-bar.bar-2");
          const bar3Els = document.querySelectorAll(".spotify-eq-bar.bar-3");
          const bar4Els = document.querySelectorAll(".spotify-eq-bar.bar-4");

          bar1Els.forEach(b => { b.style.transform = `scaleY(${bar1Scale})`; });
          bar2Els.forEach(b => { b.style.transform = `scaleY(${bar2Scale})`; });
          bar3Els.forEach(b => { b.style.transform = `scaleY(${bar3Scale})`; });
          bar4Els.forEach(b => { b.style.transform = `scaleY(${bar4Scale})`; });
        } else {
          // Graceful fallback to CSS keyframes if analyser is flat
          document.querySelectorAll(".spotify-eq-bars.audio-reactive").forEach(el => {
            el.classList.remove("audio-reactive");
          });
          const allBars = document.querySelectorAll(".spotify-eq-bar");
          allBars.forEach(bar => {
            bar.style.transform = "";
          });
        }
      } catch (e) {}

      this.eqAnimFrame = requestAnimationFrame(tick);
    };

    this.eqAnimFrame = requestAnimationFrame(tick);
  }

  renderTime({ currentTime, duration }) {
    if (this.isDraggingSeek) return;

    const curFormatted = formatTime(currentTime);
    const durFormatted = formatTime(duration);

    if (this.timeCurrent) this.timeCurrent.textContent = curFormatted;
    if (this.timeDuration) this.timeDuration.textContent = durFormatted;
    if (this.fsTimeCurrent) this.fsTimeCurrent.textContent = curFormatted;
    if (this.fsTimeDuration) this.fsTimeDuration.textContent = durFormatted;

    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
    if (this.seekFill) this.seekFill.style.width = `${pct}%`;
    if (this.seekThumb) this.seekThumb.style.left = `${pct}%`;
    if (this.fsSeekFill) this.fsSeekFill.style.width = `${pct}%`;
    if (this.fsSeekThumb) this.fsSeekThumb.style.left = `${pct}%`;
    if (this.fsLyricsProgressFill) this.fsLyricsProgressFill.style.width = `${pct}%`;
    if (this.mobileProgressFill) this.mobileProgressFill.style.width = `${pct}%`;

    // Lyrics highlight update
    lyricsService.updateHighlight(currentTime);
  }

  renderVolume({ volume, isMuted }) {
    if (this.volumeFill) {
      this.volumeFill.style.width = `${isMuted ? 0 : volume * 100}%`;
    }
    if (this.volumeBtn) {
      this.volumeBtn.innerHTML = (isMuted || volume === 0) ? ICONS.volumeMute : ICONS.volume;
    }
  }

  setFullscreenView(view = "player") {
    if (!this.fsMainBody) return;
    if (view === "lyrics") {
      this.fsMainBody.classList.remove("view-player");
      this.fsMainBody.classList.add("view-lyrics");
      this.fsSwitchPlayer?.classList.remove("active");
      this.fsSwitchLyrics?.classList.add("active");
      const lyricsContainer = document.getElementById("fs-lyrics-display");
      if (lyricsContainer && state.currentSong) {
        lyricsService.renderToContainer(lyricsContainer, state.currentSong.id);
        lyricsService.updateHighlight(state.currentTime);
      }
    } else {
      this.fsMainBody.classList.remove("view-lyrics");
      this.fsMainBody.classList.add("view-player");
      this.fsSwitchLyrics?.classList.remove("active");
      this.fsSwitchPlayer?.classList.add("active");
    }
  }

  openFullscreenPlayer(defaultView = "player") {
    if (this.fsModal) {
      this.fsModal.classList.add("open");
      this.setFullscreenView(defaultView);

      // Sync shuffle, repeat, favorite buttons in fullscreen
      if (this.fsShuffleBtn) this.fsShuffleBtn.classList.toggle("active", state.shuffle);
      if (this.fsRepeatBtn) {
        if (state.repeatMode === "one") {
          this.fsRepeatBtn.innerHTML = ICONS.repeatOne;
          this.fsRepeatBtn.classList.add("active");
        } else if (state.repeatMode === "all") {
          this.fsRepeatBtn.innerHTML = ICONS.repeat;
          this.fsRepeatBtn.classList.add("active");
        } else {
          this.fsRepeatBtn.innerHTML = ICONS.repeat;
          this.fsRepeatBtn.classList.remove("active");
        }
      }
      if (this.fsFavBtn && state.currentSong) {
        this.fsFavBtn.innerHTML = state.isFavorite(state.currentSong.id) ? ICONS.heartFilled : ICONS.heart;
      }
    }
  }

  closeFullscreenPlayer() {
    if (this.fsModal) {
      this.fsModal.classList.remove("open");
    }
  }

  toggleRightPanel(tab = "queue") {
    const mainBody = document.querySelector(".app-main-body");
    if (!mainBody) return;

    if (state.settings.rightPanelOpen && state.settings.rightPanelTab === tab) {
      state.settings.rightPanelOpen = false;
      mainBody.classList.add("right-collapsed");
    } else {
      state.settings.rightPanelOpen = true;
      state.settings.rightPanelTab = tab;
      mainBody.classList.remove("right-collapsed");
      state.notify("rightPanelTabChanged", tab);
    }
  }

  openSleepTimerModal() {
    openModal("Sleep Timer", `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <p style="font-size:0.85rem;color:var(--color-text-muted);">Automatically stop audio playback after a designated period:</p>
        <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;">
          <button class="btn-secondary timer-opt" data-mins="15">15 Minutes</button>
          <button class="btn-secondary timer-opt" data-mins="30">30 Minutes</button>
          <button class="btn-secondary timer-opt" data-mins="45">45 Minutes</button>
          <button class="btn-secondary timer-opt" data-mins="60">60 Minutes</button>
          <button class="btn-secondary timer-opt" data-mins="track">End of Track</button>
          <button class="btn-secondary timer-opt" data-mins="off" style="color:#ef4444;">Cancel Timer</button>
        </div>
      </div>
    `);

    const container = document.getElementById("modal-container");
    container.querySelectorAll(".timer-opt").forEach(btn => {
      btn.addEventListener("click", () => {
        const mins = btn.dataset.mins;
        if (mins === "off") {
          if (state.sleepTimer.timerId) clearTimeout(state.sleepTimer.timerId);
          state.sleepTimer.active = false;
          showToast("Sleep timer cancelled");
        } else if (mins === "track") {
          state.sleepTimer.active = true;
          showToast("Sleep timer set for end of current song");
        } else {
          const num = parseInt(mins, 10);
          if (state.sleepTimer.timerId) clearTimeout(state.sleepTimer.timerId);
          state.sleepTimer.active = true;
          state.sleepTimer.timerId = setTimeout(() => {
            audioEngine.pause();
            showToast("Sleep timer finished. Playback paused.");
          }, num * 60 * 1000);
          showToast(`Sleep timer set for ${num} minutes`);
        }
        closeModal();
      });
    });
  }

  openQualityModal() {
    openModal("Streaming & Audio Quality", `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px;border-radius:8px;background:var(--color-bg-card);">
            <input type="radio" name="audio-qual" value="standard" ${state.settings.audioQuality === "standard" ? "checked" : ""}>
            <div>
              <div style="font-weight:600;">Data Saver (160 kbps AAC)</div>
              <div style="font-size:0.75rem;color:var(--color-text-muted);">Optimized for metered connections and cellular networks.</div>
            </div>
          </label>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px;border-radius:8px;background:var(--color-bg-card);">
            <input type="radio" name="audio-qual" value="high" ${state.settings.audioQuality === "high" ? "checked" : ""}>
            <div>
              <div style="font-weight:600;">High Quality (320 kbps MP3/AAC)</div>
              <div style="font-size:0.75rem;color:var(--color-text-muted);">Crystal clear stereo audio with wide dynamic range.</div>
            </div>
          </label>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px;border-radius:8px;background:var(--color-bg-card);">
            <input type="radio" name="audio-qual" value="lossless" ${state.settings.audioQuality === "lossless" ? "checked" : ""}>
            <div>
              <div style="font-weight:600;color:var(--color-accent);">Lossless (ALAC/FLAC up to 24-bit/48 kHz)</div>
              <div style="font-size:0.75rem;color:var(--color-text-muted);">Bit-for-bit studio master accuracy with zero audio compression artifacts.</div>
            </div>
          </label>
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px;border-radius:8px;background:var(--color-bg-card);">
            <input type="radio" name="audio-qual" value="hi-res" ${state.settings.audioQuality === "hi-res" ? "checked" : ""}>
            <div>
              <div style="font-weight:600;color:#d4af37;">Hi-Res Lossless (24-bit/96 kHz)</div>
              <div style="font-size:0.75rem;color:var(--color-text-muted);">Audiophile resolution preserving extreme micro-dynamics and space.</div>
            </div>
          </label>
        </div>
      </div>
    `, `
      <button class="btn-primary" id="save-qual-btn">Confirm</button>
    `);

    document.getElementById("save-qual-btn")?.addEventListener("click", () => {
      const selected = document.querySelector("input[name='audio-qual']:checked")?.value || "lossless";
      state.updateSettings({ audioQuality: selected });
      showToast(`Audio quality configured: ${selected.toUpperCase()}`);
      closeModal();
    });
  }
}
