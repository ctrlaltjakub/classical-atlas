# Classical playlists

The composer timeline at [classical.jakub.computer](https://classical.jakub.computer).
Sort order is by birth, not by death or the date a playlist was published.
Period and style lines join their newest and oldest represented composers, not hard historical cutoffs. Dots mark actual membership; parallel lines show overlap. The side index jumps along the full timeline; only the separate search and filter controls narrow the list. Line colors come from [Catppuccin Mocha](https://catppuccin.com/palette/).

Run `npm run build` with Node.js 22 or newer and serve `dist/` with any static
file server. There are no package dependencies, account tokens or Spotify API
calls at build time or page load. Playlist covers are displayed from Spotify.
The composer timeline, methodology disclosure, period jumps and direct Ko-fi link work without JavaScript. JavaScript adds filtering and the live birth-year indicator.

“Works by genre” describes the music in the playlist, not a composer's entire
catalogue. Movements of a symphony count once. Independently titled songs or
dances can count separately; where a set, alternate scoring, or excerpt is the
unit, the wording says so. Genres may recur within a playlist.

The site software is licensed under [0BSD](LICENSE). That licence does not
relicense Spotify artwork, brand marks or third-party photographs. See the site's cover credits and the linked source records.
