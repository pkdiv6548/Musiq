// Vercel Serverless Function: /api/youtube/search
// Proxies queries securely to YouTube Data API v3 without exposing API keys to the client.

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails?: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
    publishTime?: string;
  };
}

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'");
}

export default async function handler(req: any, res: any) {
  // Support CORS for client-side fetches
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = (req.query?.q || "").trim();
  const pageToken = (req.query?.pageToken || "").trim();
  const maxResults = Math.min(parseInt(req.query?.maxResults || "15", 10), 30);

  if (!query) {
    return res.status(400).json({
      error: "Query parameter 'q' is required",
      items: []
    });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (apiKey && apiKey !== "YOUR_YOUTUBE_API_KEY") {
    try {
      const ytUrl = new URL("https://www.googleapis.com/youtube/v3/search");
      ytUrl.searchParams.set("part", "snippet");
      ytUrl.searchParams.set("type", "video");
      ytUrl.searchParams.set("videoCategoryId", "10"); // Music category
      ytUrl.searchParams.set("maxResults", String(maxResults));
      ytUrl.searchParams.set("q", `${query} music`);
      ytUrl.searchParams.set("key", apiKey);
      if (pageToken) {
        ytUrl.searchParams.set("pageToken", pageToken);
      }

      const response = await fetch(ytUrl.toString());
      const data = await response.json();

      if (response.ok && data.items) {
        const items = data.items
          .filter((item: YouTubeSearchItem) => item.id && item.id.videoId)
          .map((item: YouTubeSearchItem) => {
            const videoId = item.id.videoId;
            const title = decodeHtmlEntities(item.snippet.title);
            const channelTitle = decodeHtmlEntities(item.snippet.channelTitle);
            const artwork =
              item.snippet.thumbnails?.high?.url ||
              item.snippet.thumbnails?.medium?.url ||
              item.snippet.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            return {
              id: `youtube:${videoId}`,
              youtubeId: videoId,
              source: "youtube",
              title,
              artist: channelTitle,
              album: "YouTube Music",
              genre: "YouTube",
              duration: 215, // Standard placeholder until player probes duration
              artwork,
              format: "STREAM",
              addedDate: item.snippet.publishTime ? item.snippet.publishTime.split("T")[0] : new Date().toISOString().split("T")[0]
            };
          });

        return res.status(200).json({
          items,
          nextPageToken: data.nextPageToken || null,
          totalResults: data.pageInfo?.totalResults || items.length,
          source: "youtube-api"
        });
      } else {
        console.warn("YouTube API error response:", data);
        // If quota exceeded or invalid key, gracefully provide curated fallback
      }
    } catch (err) {
      console.error("YouTube API request failed:", err);
    }
  }

  // Graceful curated fallback for when YOUTUBE_API_KEY is unset or quota is exceeded
  const qLower = query.toLowerCase();
  const curatedCatalog = [
    {
      id: "youtube:dQw4w9WgXcQ",
      youtubeId: "dQw4w9WgXcQ",
      source: "youtube",
      title: "Never Gonna Give You Up",
      artist: "Rick Astley",
      album: "Whenever You Need Somebody",
      genre: "Pop / 80s",
      duration: 213,
      artwork: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:kJQP7kiw5Fk",
      youtubeId: "kJQP7kiw5Fk",
      source: "youtube",
      title: "Despacito",
      artist: "Luis Fonsi ft. Daddy Yankee",
      album: "Vida",
      genre: "Latin Pop",
      duration: 281,
      artwork: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:fJ9rUzIMcZQ",
      youtubeId: "fJ9rUzIMcZQ",
      source: "youtube",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      album: "A Night at the Opera",
      genre: "Rock",
      duration: 359,
      artwork: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:JGwWNGJdvx8",
      youtubeId: "JGwWNGJdvx8",
      source: "youtube",
      title: "Shape of You",
      artist: "Ed Sheeran",
      album: "Divide",
      genre: "Pop",
      duration: 233,
      artwork: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:OPf0YbXqDm0",
      youtubeId: "OPf0YbXqDm0",
      source: "youtube",
      title: "Uptown Funk",
      artist: "Mark Ronson ft. Bruno Mars",
      album: "Uptown Special",
      genre: "Funk / Pop",
      duration: 270,
      artwork: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:hT_nvWreIhg",
      youtubeId: "hT_nvWreIhg",
      source: "youtube",
      title: "Counting Stars",
      artist: "OneRepublic",
      album: "Native",
      genre: "Pop Rock",
      duration: 283,
      artwork: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:4NRXx6U8ABQ",
      youtubeId: "4NRXx6U8ABQ",
      source: "youtube",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      genre: "Synthwave / Pop",
      duration: 200,
      artwork: "https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:Umqb9KENgmk",
      youtubeId: "Umqb9KENgmk",
      source: "youtube",
      title: "Tum Hi Ho (Official Aashiqui 2)",
      artist: "Arijit Singh",
      album: "Aashiqui 2",
      genre: "Bollywood / Hindi",
      duration: 262,
      artwork: "https://i.ytimg.com/vi/Umqb9KENgmk/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:BddP6PYo2gs",
      youtubeId: "BddP6PYo2gs",
      source: "youtube",
      title: "Kesariya (Brahmāstra)",
      artist: "Arijit Singh, Pritam",
      album: "Brahmāstra",
      genre: "Bollywood / Hindi",
      duration: 268,
      artwork: "https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg",
      format: "STREAM"
    },
    {
      id: "youtube:2Vv-BfVoq4g",
      youtubeId: "2Vv-BfVoq4g",
      source: "youtube",
      title: "Perfect",
      artist: "Ed Sheeran",
      album: "Divide",
      genre: "Pop / Acoustic",
      duration: 263,
      artwork: "https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg",
      format: "STREAM"
    }
  ];

  const filtered = curatedCatalog.filter(
    (t) =>
      t.title.toLowerCase().includes(qLower) ||
      t.artist.toLowerCase().includes(qLower) ||
      t.genre.toLowerCase().includes(qLower) ||
      t.album.toLowerCase().includes(qLower)
  );

  const finalItems = filtered.length > 0 ? filtered : curatedCatalog;

  return res.status(200).json({
    items: finalItems,
    nextPageToken: null,
    totalResults: finalItems.length,
    isCuratedFallback: true,
    message: apiKey
      ? "YouTube Data API quota reached or request restricted. Showing curated music discovery."
      : "YouTube API Key not configured. Add YOUTUBE_API_KEY in environment to enable live search."
  });
}
