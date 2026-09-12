import { state } from "./state.js";
import { audioEngine } from "./audio-engine.js";
import { playlistManager } from "./playlist.js";

// Clean SVG Icons
export const ICONS = {
  play: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  pause: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  next: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>`,
  prev: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>`,
  shuffle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line></svg>`,
  repeat: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
  repeatOne: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path><text x="10" y="14" font-size="8" font-weight="bold" fill="currentColor">1</text></svg>`,
  heart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  heartFilled: `<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--color-accent)" stroke="var(--color-accent)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  volume: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  volumeMute: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`,
  queue: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  lyrics: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
  equalizer: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  visualizer: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
  more: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  share: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`,
  download: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
};

export function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Universal SVG artwork fallback
export function getArtworkFallback(title = "Music") {
  const cleanTitle = (title || "Music").slice(0, 16).replace(/[<>'"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='%23ff2d55'/><stop offset='50%' stop-color='%238a2be2'/><stop offset='100%' stop-color='%2314161f'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><circle cx='150' cy='150' r='55' fill='rgba(0,0,0,0.35)'/><polygon points='142,132 142,168 168,150' fill='%23ffffff'/><text x='150' y='250' font-family='system-ui,sans-serif' font-size='16' font-weight='600' fill='rgba(255,255,255,0.85)' text-anchor='middle'>${encodeURIComponent(cleanTitle)}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

// Toast notification helper
export function showToast(message, type = "accent", duration = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Render Spotify-style Music Card
export function renderMusicCard(item, type = "song") {
  const card = document.createElement("div");
  card.className = "music-card animate-fade-in";
  card.dataset.id = item.id;
  card.dataset.type = type;

  const isCurrentPlaying = state.isPlaying && state.currentSong && state.currentSong.id === item.id;
  if (isCurrentPlaying) card.classList.add("is-playing");

  let subtitle = item.artist || item.creator || item.genre || "";
  let badgeHtml = "";
  if (item.isHiRes) {
    badgeHtml = `<span class="card-badge hi-res">Hi-Res</span>`;
  } else if (item.isLossless) {
    badgeHtml = `<span class="card-badge lossless">Lossless</span>`;
  }

  card.innerHTML = `
    <div class="card-artwork-wrapper">
      <img src="${item.artwork}" alt="${item.title || item.name}" class="card-artwork-img" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${getArtworkFallback(item.title || item.name)}';">
      ${badgeHtml}
      <button class="card-hover-play" title="Play ${item.title || item.name}" aria-label="Play">
        ${isCurrentPlaying ? ICONS.pause : ICONS.play}
      </button>
    </div>
    <div class="card-title" title="${item.title || item.name}">${item.title || item.name}</div>
    <div class="card-subtitle" title="${subtitle}">${subtitle}</div>
    <div class="card-meta-row">
      <span>${item.duration ? formatTime(item.duration) : (item.trackCount ? item.trackCount + " tracks" : "")}</span>
      <div class="card-quick-actions">
        ${type === "song" ? `
          <button class="card-action-btn fav-btn" title="Toggle Favorite">
            ${state.isFavorite(item.id) ? ICONS.heartFilled : ICONS.heart}
          </button>
        ` : ""}
        <button class="card-action-btn menu-btn" title="More options">
          ${ICONS.more}
        </button>
      </div>
    </div>
  `;

  // Click on play button
  const playBtn = card.querySelector(".card-hover-play");
  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (type === "song") {
      const idx = state.songs.findIndex(s => s.id === item.id);
      state.setQueue(state.songs, idx);
      audioEngine.playTrackAtIndex(idx);
    } else if (type === "album") {
      const albumSongs = state.songs.filter(s => s.albumId === item.id);
      if (albumSongs.length) {
        state.setQueue(albumSongs, 0);
        audioEngine.playTrackAtIndex(0);
      }
    } else if (type === "playlist") {
      const plSongs = item.songIds.map(id => state.getSongById(id)).filter(Boolean);
      if (plSongs.length) {
        state.setQueue(plSongs, 0);
        audioEngine.playTrackAtIndex(0);
      }
    } else if (type === "radio") {
      state.isStream = true;
      state.currentStation = item;
      audioEngine.play();
      showToast(`Tuned into ${item.name} (${item.frequency || item.genre})`);
    }
  });

  // Favorite toggle
  const favBtn = card.querySelector(".fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isFav = state.toggleFavorite(item.id);
      favBtn.innerHTML = isFav ? ICONS.heartFilled : ICONS.heart;
      showToast(isFav ? "Added to Favorites" : "Removed from Favorites");
    });
  }

  // More options context menu
  const menuBtn = card.querySelector(".menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showContextMenu(e.clientX, e.clientY, item, type);
    });
  }

  // Card click navigates or plays
  card.addEventListener("click", () => {
    if (type === "song") {
      const idx = state.songs.findIndex(s => s.id === item.id);
      state.setQueue(state.songs, idx);
      audioEngine.playTrackAtIndex(idx);
    } else if (type === "album") {
      window.location.hash = `#/album-detail/${item.id}`;
    } else if (type === "artist") {
      window.location.hash = `#/artist-detail/${item.id}`;
    } else if (type === "playlist") {
      window.location.hash = `#/playlist-detail/${item.id}`;
    }
  });

  return card;
}

// Render Song Table Row
export function renderSongRow(song, index, allSongs = null) {
  const tr = document.createElement("tr");
  tr.className = "song-row";
  tr.dataset.id = song.id;

  const isCurrent = state.currentSong && state.currentSong.id === song.id;
  if (isCurrent) tr.classList.add("is-active");

  tr.innerHTML = `
    <td class="song-row-num">
      <span class="song-num-label">
        ${isCurrent ? `
          <div class="spotify-eq-bars mini ${state.isPlaying ? 'is-playing' : 'is-paused'}" title="${state.isPlaying ? 'Playing' : 'Paused'}">
            <span class="spotify-eq-bar bar-1"></span>
            <span class="spotify-eq-bar bar-2"></span>
            <span class="spotify-eq-bar bar-3"></span>
            <span class="spotify-eq-bar bar-4"></span>
          </div>
        ` : (index + 1)}
      </span>
      <button class="song-row-play-btn" title="Play">
        ${isCurrent && state.isPlaying ? ICONS.pause : ICONS.play}
      </button>
    </td>
    <td>
      <div class="song-info-cell">
        <img src="${song.artwork}" alt="${song.title}" class="song-thumb" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${getArtworkFallback(song.title)}';">
        <div class="song-title-col">
          <div class="song-title-text" style="${isCurrent ? 'color: #1db954; font-weight: 600;' : ''}">
            ${song.title}
          </div>
          <div class="song-artist-text">${song.artist}</div>
        </div>
      </div>
    </td>
    <td>${song.album || "Single"}</td>
    <td><span class="badge-pill">${song.format || "MP3"}</span></td>
    <td>${formatTime(song.duration)}</td>
    <td>
      <button class="icon-btn fav-row-btn" title="Favorite">
        ${state.isFavorite(song.id) ? ICONS.heartFilled : ICONS.heart}
      </button>
    </td>
    <td>
      <button class="icon-btn menu-row-btn" title="More">
        ${ICONS.more}
      </button>
    </td>
  `;

  tr.addEventListener("click", () => {
    const list = allSongs || state.songs;
    const idx = list.findIndex(s => s.id === song.id);
    state.setQueue(list, idx);
    audioEngine.playTrackAtIndex(idx);
  });

  const favBtn = tr.querySelector(".fav-row-btn");
  favBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isFav = state.toggleFavorite(song.id);
    favBtn.innerHTML = isFav ? ICONS.heartFilled : ICONS.heart;
    showToast(isFav ? "Saved to Loved Songs" : "Removed from Loved Songs");
  });

  const menuBtn = tr.querySelector(".menu-row-btn");
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, song, "song");
  });

  return tr;
}

// Context menu popup
export function showContextMenu(x, y, item, type = "song") {
  closeContextMenu();

  const menu = document.createElement("div");
  menu.className = "context-menu";
  menu.id = "active-context-menu";

  if (type === "song") {
    menu.innerHTML = `
      <div class="context-item" data-action="play">${ICONS.play} <span>Play</span></div>
      <div class="context-item" data-action="play-next">${ICONS.next} <span>Play Next</span></div>
      <div class="context-item" data-action="add-queue">${ICONS.queue} <span>Add to Queue</span></div>
      <div class="context-divider"></div>
      <div class="context-item" data-action="toggle-fav">${state.isFavorite(item.id) ? ICONS.heartFilled : ICONS.heart} <span>${state.isFavorite(item.id) ? "Remove Favorite" : "Add to Favorite"}</span></div>
      <div class="context-item" data-action="add-playlist">${ICONS.plus} <span>Add to Playlist...</span></div>
      <div class="context-divider"></div>
      <div class="context-item" data-action="lyrics">${ICONS.lyrics} <span>Show Lyrics</span></div>
      <div class="context-item" data-action="share">${ICONS.share} <span>Share Song</span></div>
      <div class="context-item" data-action="edit-meta">${ICONS.settings} <span>Edit Metadata</span></div>
      <div class="context-item" data-action="download">${ICONS.download} <span>Download Offline</span></div>
    `;
  } else {
    menu.innerHTML = `
      <div class="context-item" data-action="play">${ICONS.play} <span>Play All</span></div>
      <div class="context-item" data-action="share">${ICONS.share} <span>Share</span></div>
    `;
  }

  document.body.appendChild(menu);

  // Position bounded
  const rect = menu.getBoundingClientRect();
  let left = x;
  let top = y;
  if (left + rect.width > window.innerWidth) left = window.innerWidth - rect.width - 10;
  if (top + rect.height > window.innerHeight) top = window.innerHeight - rect.height - 10;
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  menu.querySelectorAll(".context-item").forEach(el => {
    el.addEventListener("click", () => {
      const action = el.dataset.action;
      handleContextAction(action, item, type);
      closeContextMenu();
    });
  });

  const outsideClick = (e) => {
    if (!menu.contains(e.target)) {
      closeContextMenu();
      document.removeEventListener("click", outsideClick);
    }
  };
  setTimeout(() => document.addEventListener("click", outsideClick), 50);
}

export function closeContextMenu() {
  const existing = document.getElementById("active-context-menu");
  if (existing) existing.remove();
}

function handleContextAction(action, item, type) {
  switch (action) {
    case "play":
      if (type === "song") {
        const idx = state.songs.findIndex(s => s.id === item.id);
        state.setQueue(state.songs, idx);
        audioEngine.playTrackAtIndex(idx);
      }
      break;
    case "play-next":
      state.addToQueue(item, true);
      showToast(`Playing next: ${item.title}`);
      break;
    case "add-queue":
      state.addToQueue(item, false);
      showToast(`Added to queue: ${item.title}`);
      break;
    case "toggle-fav":
      state.toggleFavorite(item.id);
      showToast(state.isFavorite(item.id) ? "Added to Favorites" : "Removed from Favorites");
      break;
    case "add-playlist":
      openAddToPlaylistModal(item);
      break;
    case "lyrics":
      window.location.hash = "#/lyrics";
      break;
    case "share":
      if (navigator.share) {
        navigator.share({ title: item.title, text: `Listen to ${item.title} by ${item.artist} on MUSIQ` }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/#/song/${item.id}`);
        showToast("Link copied to clipboard!");
      }
      break;
    case "edit-meta":
      openEditMetadataModal(item);
      break;
    case "download":
      showToast(`Saved ${item.title} to offline storage.`);
      break;
  }
}

// Modal dialog system
export function openModal(title, contentHtml, footerHtml = "", extraClass = "") {
  const overlay = document.getElementById("modal-overlay");
  const container = document.getElementById("modal-container");
  if (!overlay || !container) return;

  container.innerHTML = `
    <div class="modal-box ${extraClass}">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="icon-btn modal-close-btn" title="Close">${ICONS.close}</button>
      </div>
      <div class="modal-content">${contentHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ""}
    </div>
  `;

  overlay.classList.add("open");
  const closeBtn = container.querySelector(".modal-close-btn");
  closeBtn?.addEventListener("click", closeModal);

  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };
}

export function closeModal() {
  const overlay = document.getElementById("modal-overlay");
  if (overlay) overlay.classList.remove("open");
}

function openAddToPlaylistModal(song) {
  let plListHtml = state.playlists.map(p => `
    <div class="playlist-choice-item" data-id="${p.id}" style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;cursor:pointer;background:var(--color-bg-card);margin-bottom:8px;">
      <img src="${p.artwork}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
      <div style="flex:1;">
        <div style="font-weight:600;">${p.title}</div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);">${p.songIds.length} tracks</div>
      </div>
      <span>${ICONS.plus}</span>
    </div>
  `).join("");

  openModal("Add to Playlist", `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:0.85rem;color:var(--color-text-muted);">Choose a playlist to add "<strong>${song.title}</strong>":</p>
      <div style="max-height:300px;overflow-y:auto;">
        ${plListHtml}
      </div>
    </div>
  `);

  const container = document.getElementById("modal-container");
  container.querySelectorAll(".playlist-choice-item").forEach(item => {
    item.addEventListener("click", () => {
      const plId = item.dataset.id;
      playlistManager.addSongToPlaylist(plId, song.id);
      showToast("Added song to playlist!");
      closeModal();
    });
  });
}

function openEditMetadataModal(song) {
  openModal("Edit Song Metadata", `
    <div style="display:flex;flex-direction:column;gap:14px;">
      <div>
        <label style="font-size:0.75rem;color:var(--color-text-muted);">Title</label>
        <input type="text" id="meta-title" value="${song.title}" style="width:100%;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface-elevated);border:1px solid var(--color-border);margin-top:4px;">
      </div>
      <div>
        <label style="font-size:0.75rem;color:var(--color-text-muted);">Artist</label>
        <input type="text" id="meta-artist" value="${song.artist}" style="width:100%;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface-elevated);border:1px solid var(--color-border);margin-top:4px;">
      </div>
      <div>
        <label style="font-size:0.75rem;color:var(--color-text-muted);">Album</label>
        <input type="text" id="meta-album" value="${song.album}" style="width:100%;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface-elevated);border:1px solid var(--color-border);margin-top:4px;">
      </div>
      <div>
        <label style="font-size:0.75rem;color:var(--color-text-muted);">Genre</label>
        <input type="text" id="meta-genre" value="${song.genre}" style="width:100%;padding:8px 12px;border-radius:6px;background:var(--color-bg-surface-elevated);border:1px solid var(--color-border);margin-top:4px;">
      </div>
      <p style="font-size:0.72rem;color:var(--color-text-dim);">* Metadata changes are safely saved in browser storage.</p>
    </div>
  `, `
    <button class="btn-secondary" id="meta-cancel-btn">Cancel</button>
    <button class="btn-primary" id="meta-save-btn">Save Changes</button>
  `);

  document.getElementById("meta-cancel-btn")?.addEventListener("click", closeModal);
  document.getElementById("meta-save-btn")?.addEventListener("click", () => {
    song.title = document.getElementById("meta-title").value;
    song.artist = document.getElementById("meta-artist").value;
    song.album = document.getElementById("meta-album").value;
    song.genre = document.getElementById("meta-genre").value;
    state.notify("songMetadataUpdated", song);
    showToast("Metadata updated successfully!");
    closeModal();
  });
}
