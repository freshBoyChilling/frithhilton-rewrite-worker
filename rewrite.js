addEventListener('fetch', event => {
  event.respondWith(handleRewrite(event.request));
});

async function handleRewrite(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if URL matches /albums/{album-name}/{song-name}
  const match = path.match(/^\/albums\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    // Pass through if not a rewrite candidate
    return fetch(request);
  }

  const [, albumName, songName] = match;
  const albumsUrl = 'https://raw.githubusercontent.com/freshBoyChilling/discography/main/data/albums.json';

  // Fetch albums.json to map URL to track ID
  let albums;
  try {
    const res = await fetch(albumsUrl);
    if (!res.ok) throw new Error('Failed to fetch albums.json');
    albums = await res.json();
  } catch (e) {
    return new Response('Error fetching albums data: ' + e.message, { status: 500 });
  }

  // Find matching album and song
  let trackId;
  for (const album of albums) {
    if (album.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === albumName.toLowerCase()) {
      const song = album.songs.find(s => s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === songName.toLowerCase());
      if (song) {
        trackId = song.id;
        break;
      }
    }
  }

  if (!trackId) {
    return new Response('Track not found', { status: 404 });
  }

  // Rewrite URL to freshPlayer.html?track={id}
  const newUrl = `https://www.frithhilton.com.ng/pages/freshPlayer.html?track=${trackId}`;
  return fetch(new Request(newUrl, request));
}
