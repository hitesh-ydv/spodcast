const client_id = "4fed9d932c7840a292b8f10a34a8a892";
const client_secret = "fa138e9b886743a9970fccbad0bf5150";
let likedSongs = JSON.parse(localStorage.getItem("likedSongs")) || [];
let recommendedSongs = JSON.parse(localStorage.getItem("recommendedSongs")) || [];
let currentSong = JSON.parse(localStorage.getItem("currentSong")) || null;
let rightSection = document.getElementById("right-section");

rightSection.style.display = "none";

let middleSection = document.getElementById('middle-section');
let currentlyPlayingSongId = null;
let isPlaying = false;
let defaultArtistId = '6DARBhWbfcS9E4yJzcliqQ';

let currentSongIndex = 0;
let songQueue = []; // Array to hold fetched songs
var isShuffle = false;
var playedSongs = new Set();


// Default song ID to use when recommended tracks = 0 or on the first visit
const defaultSongId = "0biuGbhZwYnuUwMOi4fvaN";

async function playSongFromApi(songId, track) {
  let apiUrl = `https://jiosavan-api-with-playlist.vercel.app/api/songs/${songId}`;

  let audioPlayer = document.getElementById("audio-player");

  try {
    const loadingSpinner = document.getElementById("loading-spinner");
    const loadingSpinner2 = document.getElementById("loading-outer");
    loadingSpinner.style.display = "block";
    loadingSpinner2.style.display = 'flex'
    const videoElement = document.getElementById('canvas-player');
    document.getElementById('footer-outer').style.display = 'block';
    console.log(track)


    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      const streamUrl = data.data[0].downloadUrl[2].url;

      loadingSpinner.style.display = "none";
      loadingSpinner2.style.display = "none";
      audioPlayer.src = streamUrl;
      enableAudioPlayer();
      audioPlayer.play();
      playPauseBtn.className = "ri-pause-line";
      playPauseBtn2.className = "ri-pause-line";
      footerPlay.className = "ri-pause-line";

      createSongDetails(track, streamUrl);
      createSongDetails2(track, streamUrl);
      updateMediaSession(track);
      fetchAndDisplayLyrics(track.id);
      fetchAndDisplayArtist(track.artists.primary[0].id);


      if (track) {
        document.title = `${track.name} • ${track.artists.primary[0].name}`;
      }


      setBackgroundColorFromImage(track);
      addToRecentlyPlayed(track); // Show the video player

      function setBackgroundColorFromImage(imageUrl) {
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Ensure the image is fetched with CORS support
        img.src = track.image[2].url;

        img.onload = function () {
          // Extract the dominant color
          const dominantColor = colorThief.getPalette(img, 10);

          const secondArray = dominantColor[3];

          const darkColor = darkenColor(secondArray);

          // Convert RGB array to CSS color
          const rgbColor = `rgb(${darkColor[0]}, ${darkColor[1]}, ${darkColor[2]})`;

          const gradientBackground = `linear-gradient(to bottom, ${rgbColor} 20%, rgb(0,0,0) 115%)`;

          // Set the background color of the right section
          document.getElementById('right-section').style.background = rgbColor;
          document.getElementById('footer').style.background = rgbColor;
        };

        img.onerror = function () {
          console.log("Error loading image for color extraction");
        };
      }

    } else {
      alert("This song is not available for this region.");
      loadingSpinner.style.display = "none";
      var x = window.matchMedia("(max-width: 425px)")
      if (x.matches) {
        closeBottomSheet()

      } else {
        rightSection.style.display = 'none';
      }
    }
  } catch (error) {
    console.error("Error fetching the audio stream:", error);
  }
}

let audioPlayer2 = document.getElementById("audio-player");
document.addEventListener("keydown", (event) => {
  // Check if the pressed key is the spacebar
  if (event.code === "Space") {
    // Prevent default behavior only if not typing in an input field
    if (event.target.tagName !== "INPUT" && event.target.tagName !== "TEXTAREA") {
      event.preventDefault(); // Prevent the page from scrolling
      if (!audioPlayer2.paused) {
        audioPlayer2.pause();
      } else {
        audioPlayer2.play();
      }
    }
  }
});


// Function to Get Access Token
async function getAccessToken() {
  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + btoa(client_id + ":" + client_secret),
    },
    body: "grant_type=client_credentials",
  });

  const data = await result.json();
  return data.access_token;
}



// Function to Fetch Tracks Based on Search Query
async function fetchAlbumsTracks(albumId) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://jiosavan-api-with-playlist.vercel.app/api/playlists?id=${albumId}&limit=50`
  );

  const data = await response.json();
  document.getElementById('album-container').style.display = "flex";
  displayAlbumDetails(data.data);
  displayTrackCards(data.data.songs);
}

function displayAlbumDetails(data) {
  const albumImage = document.getElementById("album-image");
  const albumName = document.getElementById("album-name");
  const albumArtists = document.getElementById("album-artists");

  albumImage.src = data.image[2].url;
  albumImage.classList.add('skeleton');
  albumImage.classList.add('skeleton-img');
  albumImage.alt = data.name;
  albumName.textContent = data.name;
  albumArtists.textContent = "PLAYLIST";
}

function displayTrackCards(songs) {
  const trackCardContainer = document.getElementById("track-card-container");
  trackCardContainer.innerHTML = ""; // Clear previous content

  songs.forEach((song, index) => {
    const trackCard = document.createElement("div");
    trackCard.className = "track-card-album";

    trackCard.innerHTML = `
          <h4>${index + 1}. </h4>
          <img src="${song.image[2].url}" class="skeleton skeleton-img" loading="lazy">
          <div>
            <h3>${song.name}</h3>
            <p>${song.artists.primary.map((artist) => artist.name).join(", ")}</p>
          </div>
      `;
    trackCard.addEventListener("click", () => {
      songQueue = songs;
      currentSongIndex = index;
      playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
      showPopup();
    })
    trackCardContainer.appendChild(trackCard);
  });
}


document.getElementById('album-close-btn').addEventListener("click", () => {
  document.getElementById('artist-outer').style.display = 'block';
  document.getElementById('tracks-outer').style.display = 'block';
  document.getElementById('album-inner').style.display = 'none';
  document.getElementById('main-header').style.display = 'flex';
  const trackCardContainer = document.getElementById("track-card-container");
  trackCardContainer.innerHTML = "";
  const albumImage = document.getElementById("album-image");
  const albumName = document.getElementById("album-name");
  const albumArtists = document.getElementById("album-artists");

  albumImage.src = '';
  albumImage.alt = '';
  albumName.textContent = '';
  albumArtists.textContent = '';

})


// Function to Fetch Tracks Based on Search Query
async function fetchAlbums(query) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://jiosavan-api-with-playlist.vercel.app/api/search/playlists?query=${encodeURIComponent(
      query
    )}&limit=20`
  );

  const data = await response.json();
  document.getElementById("artist-outer").style.display = "block";
  displayAlbums(data.data.results);
}

// Display artists in the artist-container with images and names
function displayAlbums(artists) {
  const artistContainer = document.getElementById('album-search-container');
  artistContainer.innerHTML = ''; // Clear existing artists

  artists.forEach(artist => {
    const artistCard = document.createElement('div');
    artistCard.classList.add('track-card');

    artistCard.innerHTML = `
      <img src="${artist.image[2].url}" class="skeleton skeleton-img" loading="lazy">
      <div class="song-details">
        <h3>${artist.name}</h3>
        <p>${artist.type.toUpperCase()}</p>
      </div>
    `;
    artistCard.addEventListener("click", () => {
      fetchAlbumsTracks(artist.id)
      document.getElementById('middle-section').scrollTop = 0;
      document.getElementById('artist-outer').style.display = 'none';
      document.getElementById('tracks-outer').style.display = 'none';
      document.getElementById('album-inner').style.display = 'block';
      document.getElementById('main-header').style.display = 'none';

    })
    artistContainer.appendChild(artistCard);
  });
}

let isRepeat = false;

var audioPlayer = document.getElementById("audio-player");
audioPlayer.addEventListener("ended", () => {
  if (isShuffle) {
    // Shuffle mode: Pick a random song that hasn't been played
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * songQueue.length);
    } while (playedSongs.has(randomIndex) && playedSongs.size < songQueue.length);

    playedSongs.add(randomIndex); // Mark this song as played

    if (playedSongs.size === songQueue.length) {
      playedSongs.clear(); // Reset once all songs are played
    }

    currentSongIndex = randomIndex;
  } else {
    // Sequential mode: Play the next song
    currentSongIndex++;
    if (currentSongIndex >= songQueue.length) {
      currentSongIndex = 0; // Loop back to the start
    }
  }

  playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
});




// Function to Fetch Tracks Based on Search Query
async function fetchTracks(query) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=${encodeURIComponent(
      query
    )}&limit=20`
  );

  const data = await response.json();

  displayTracks(data.data.results);
  document.getElementById('search-for').style.display = 'block';
}



// Function to Display Tracks
function displayTracks(tracks) {
  const container = document.getElementById("tracks-container");
  container.innerHTML = "";

  tracks.forEach((track, index) => {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const image = document.createElement("img");
    image.src = track.image[2].url;
    image.classList.add('skeleton');
    image.classList.add('lazy');
    image.classList.add('placeholder');
    image.dataset.src = track.image[2].url;

    const songName = document.createElement("h3");
    songName.textContent = track.name;

    const artists = document.createElement("p");
    artists.textContent = track.artists.primary.map((artist) => artist.name).join(", ");

    const likeIcon = document.createElement("i");
    likeIcon.classList.add("ri-add-circle-line", "liked-icon");

    // Check if the song is already liked
    if (isSongLiked(track.id)) {
      likeIcon.classList.replace("ri-add-circle-line", "ri-check-line");
    }

    likeIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      handleTrackLike(track, likeIcon);
    });

    card.appendChild(image);
    card.appendChild(songName);
    card.appendChild(artists);
    card.appendChild(likeIcon);

    card.addEventListener("click", () => {

      currentSongIndex = index;
      let showLyrics = document.getElementById('show-lyrics');
      showLyrics.style.display = "flex";
      playSongFromApi(track.id, track);
      fetchSearchTracksRecommendations(track.id)
      showPopup();
    });

    container.appendChild(card);
  });

  applyLazyLoading();
}


// Function to apply lazy loading using IntersectionObserver
function applyLazyLoading() {
  const lazyImages = document.querySelectorAll('.lazy');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src; // Set the actual image source
        img.classList.remove('placeholder'); // Remove placeholder styling
        observer.unobserve(img); // Stop observing this image
      }
    });
  });

  lazyImages.forEach(img => observer.observe(img));
}


// Function to toggle song like (centralized)
function toggleLikeSong(track) {
  if (isSongLiked(track.id)) {
    // If the song is already liked, remove it from the likedSongs array
    likedSongs = likedSongs.filter((song) => song.id !== track.id);
  } else {
    // If the song is not liked yet, add it to the likedSongs array
    likedSongs.push(track);
  }

  // Save the updated likedSongs array to localStorage
  localStorage.setItem("likedSongs", JSON.stringify(likedSongs));

  // Update both the liked songs container and the recommendations/tracks containers
  displayLikedSongs();
  displayLikedSongs2(); // For the second container
  updateAllLikeIcons(); // Updates the like icons in both containers
}


// Function to handle liking/unliking from the recommendations container
function handleRecommendationLike(track, likeIcon) {
  toggleLikeSong(track);
  updateLikeIcon(likeIcon, track.id); // Update the like icon
}

// Function to handle liking/unliking from the tracks container
function handleTrackLike(track, likeIcon) {
  toggleLikeSong(track);
  updateLikeIcon(likeIcon, track.id); // Update the like icon
}

// Function to update a specific like icon
function updateLikeIcon(icon, trackId) {
  if (isSongLiked(trackId)) {
    icon.classList.replace("ri-add-circle-line", "ri-check-line");
  } else {
    icon.classList.replace("ri-check-line", "ri-add-circle-line");
  }
}

// Function to update all like icons in both the tracks and recommendations containers
function updateAllLikeIcons() {
  // Update like icons in the tracks container
  const trackCards = document.querySelectorAll("#tracks-container .track-card");
  trackCards.forEach((card) => {
    const likeIcon = card.querySelector(".liked-icon");
    const trackId = card.getAttribute("data-track-id");
    if (isSongLiked(trackId)) {
      likeIcon.classList.replace("ri-add-circle-line", "ri-check-line");
    } else {
      likeIcon.classList.replace("ri-check-line", "ri-add-circle-line");
    }
  });

  // Update like icons in the recommendations container
  const recommendationCards = document.querySelectorAll("#recommendations-container .track-card");
  recommendationCards.forEach((card) => {
    const likeIcon = card.querySelector(".liked-icon");
    const trackId = card.getAttribute("data-track-id");
    if (isSongLiked(trackId)) {
      likeIcon.classList.replace("ri-add-circle-line", "ri-check-line");
    } else {
      likeIcon.classList.replace("ri-check-line", "ri-add-circle-line");
    }
  });
}



// Check if song is liked
function isSongLiked(id) {
  return likedSongs.some((song) => song.id === id);
}



// Function to toggle song like
function toggleLikeSong(track) {
  if (isSongLiked(track.id)) {
    likedSongs = likedSongs.filter((song) => song.id !== track.id);
  } else {
    likedSongs.push(track);
  }
  localStorage.setItem("likedSongs", JSON.stringify(likedSongs));
  displayLikedSongs();
  displayLikedSongs2();
}



// Function to Display Liked Songs
function displayLikedSongs() {
  const likedContainer = document.getElementById("liked-songs-container");
  likedContainer.innerHTML = "";

  likedSongs.forEach((track) => {
    if (track) {
      document.getElementById("no-liked-songs").style.display = "none";
    } else {
      document.getElementById("no-liked-songs").style.display = "block";
    }

    const card = document.createElement("div");
    card.classList.add("liked-song-card");

    const songInfo = document.createElement("div");
    songInfo.classList.add("song-details");

    const image = document.createElement("img");
    image.src = track.image[2].url;

    const songName = document.createElement("h4");
    songName.textContent = track.name;

    const artists = document.createElement("p");
    artists.textContent = track.artists.primary.map((artist) => artist.name).join(", ");

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("ri-delete-bin-line", "delete-icon");
    deleteIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLikeSong(track);
    });

    card.appendChild(image);
    songInfo.appendChild(songName);
    songInfo.appendChild(artists);
    card.appendChild(songInfo);
    card.appendChild(deleteIcon);

    card.addEventListener("click", () => {
      playSongFromApi(track.id, track);
      showPopup();
      rightSection.style.display = "block";
    });

    likedContainer.appendChild(card);
  });
}



// Function to display liked songs in the second liked songs container in reverse order (horizontally)
function displayLikedSongs2() {
  const likedContainer2 = document.getElementById("liked-songs-container2");
  likedContainer2.innerHTML = ""; // Clear the container before rendering


  likedSongs.forEach((track) => {
    const x = window.matchMedia("(max-width: 425px)")
    if (track) {
      if (x.matches) {
        document.getElementById('liked-outer').style.display = 'block';
      }
    }

    const card = document.createElement("div");
    card.classList.add("track-card");

    const songInfo = document.createElement("div");
    songInfo.classList.add("song-details");

    const image = document.createElement("img");
    image.src = track.image[2].url;
    image.alt = track.name;

    const songName = document.createElement("h4");
    songName.textContent = track.name;

    const artists = document.createElement("p");
    artists.textContent = track.artists.primary.map((artist) => artist.name).join(", ");

    const deleteIcon = document.createElement("i");
    deleteIcon.classList.add("ri-delete-bin-line", "delete-icon");
    deleteIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLikeSong(track);
      if (!track) {
        document.getElementById('liked-outer').style.display = 'none';
      }  // Remove the song from liked songs
    });

    card.appendChild(image);
    songInfo.appendChild(songName);
    songInfo.appendChild(artists);
    card.appendChild(songInfo);
    card.appendChild(deleteIcon);

    card.addEventListener("click", () => {
      playSongFromApi(track.id, track);
      showPopup();
      rightSection.style.display = "block"; // Play song from liked songs when clicked
    });

    // Prepend the new liked song at the start (reverse order)
    likedContainer2.prepend(card);
  });
}






function darkenColor(color, factor = 0.5) {
  // Darken the RGB values by the specified factor
  return color.map(value => Math.floor(value * factor));
}

// Function to Save Current Song to Local Storage
function saveCurrentSong(track, streamUrl) {
  const songData = {
    id: track.id,
    name: track.album.name,
    artists: track.artists.primary.map((artist) => artist.name).join(", "),
    image: track.image[2].url,
    audioUrl: streamUrl,
  };
  localStorage.setItem("currentSong", JSON.stringify(songData));
}



async function fetchRecommendations(trackId) {
  const response = await fetch(
    `https://jiosavan-api-with-playlist.vercel.app/api/songs/jx2G3Mjl/suggestions`);

  const data = await response.json();
  document.getElementById('recommend-outer').style.display = 'block';
  displayRecommendations(data.data);
  displayArtists(data.data);
}

// Function to Fetch Recommended Tracks Based on Selected Track or Default Song
async function fetchSearchTracksRecommendations(trackId) {
  const response = await fetch(
    `https://jiosavan-api-with-playlist.vercel.app/api/songs/${trackId}/suggestions?limit=20`);

  const data = await response.json();
  songQueue = data.data;
}





// Display artists in the artist-container with images and names
function displayArtists(artists) {
  const artistContainer = document.getElementById('artist-container');
  artistContainer.innerHTML = ''; // Clear existing artists

  artists.forEach(artist => {
    const artistCard = document.createElement('div');
    artistCard.classList.add('track-card');

    artistCard.innerHTML = `
      <img src="${artist.artists.primary[0].image[2].url}" class="skeleton" loading="lazy">
      <div class="song-details">
        <h3>${artist.artists.primary[0].name}</h3>
        <p>${artist.artists.primary[0].type.toUpperCase()}</p>
      </div>
    `;
    artistContainer.appendChild(artistCard);
  });
}



// Function to Display Recommended Tracks

function displayRecommendations(tracks) {
  const container = document.getElementById("recommendations-container");
  container.innerHTML = "";

  tracks.forEach((track, index) => {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const image = document.createElement("img");
    image.classList.add('skeleton');
    image.classList.add('lazy');
    image.classList.add('placeholder');
    image.dataset.src = track.image[2].url;
    image.src = track.image[2].url;
    image.alt = track.name;

    const songName = document.createElement("h3");
    songName.textContent = track.name;
    songName.classList.add('skeleton-text');

    const artists = document.createElement("p");
    artists.classList.add('skeleton-text');
    artists.textContent = track.artists.primary.map((artist) => artist.name).join(", ");

    const likeIcon = document.createElement("i");
    likeIcon.classList.add("ri-add-circle-line", "liked-icon");

    if (isSongLiked(track.id)) {
      likeIcon.classList.replace("ri-add-circle-line", "ri-check-line");
    }

    likeIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      handleRecommendationLike(track, likeIcon);
    });

    card.appendChild(image);
    card.appendChild(songName);
    card.appendChild(artists);
    card.appendChild(likeIcon);

    card.addEventListener("click", () => {
      songQueue = tracks;
      currentSongIndex = index;
      let showLyrics = document.getElementById('show-lyrics');
      showLyrics.style.display = "flex";
      playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
      showPopup();
      rightSection.style.display = "block";
    });

    container.appendChild(card);
  });
  applyLazyLoading();
}


function createMarqueeEffect(element, container) {
  const containerWidth = container.offsetWidth;
  const elementWidth = element.scrollWidth;

  // Check if the text overflows the container
  if (elementWidth > containerWidth) {
    // Set initial position and animation duration based on the overflow size
    const distanceToScroll = elementWidth - containerWidth; // The distance to scroll
    const scrollDuration = distanceToScroll / 20; // Adjust the speed of scroll

    // Function to start the marquee effect
    function startMarquee() {
      // Reset to initial position
      element.style.transition = 'transform 0s';
      element.style.transform = 'translateX(0)';

      setTimeout(() => {
        // Scroll to the left with animation
        element.style.transition = `transform ${scrollDuration}s linear`;
        element.style.transform = `translateX(-${distanceToScroll}px)`;

        // After scrolling left, pause for 2 seconds and then scroll back
        setTimeout(() => {
          // After 2-second pause, scroll back to start smoothly
          element.style.transition = `transform ${scrollDuration}s linear`;
          element.style.transform = 'translateX(0)';
        }, scrollDuration * 1000 + 3000); // Pause for 2 seconds after scrolling left
      }, 3000); // Start immediately
    }

    // Start the animation and repeat after the cycle completes
    setInterval(startMarquee, (scrollDuration * 2 + 2) * 1000 + 5000);   // Adjust timing to include the 2-second pause
    startMarquee();
  }
}



// Function to Save and Display Song Details in Song Thumb Container

function createSongDetails(track, streamUrl) {
  const songThumb = document.getElementById("song-thumb");
  songThumb.innerHTML = "";

  const image = document.createElement("img");
  image.src = track.image[2].url;
  image.classList.add('skeleton');
  image.classList.add('skeleton-img');

  const detailsDiv = document.createElement("div");
  detailsDiv.classList.add("song-details2");

  const songName = document.createElement("h3");
  songName.textContent = track.name;

  const artists = document.createElement("p");
  artists.classList.add('current-song-artist');
  artists.textContent = track.artists.primary.map((artist) => artist.name).join(", ");

  detailsDiv.appendChild(songName);
  detailsDiv.appendChild(artists);
  songThumb.appendChild(image);
  songThumb.appendChild(detailsDiv);

  createMarqueeEffect(songName, songThumb);

  // Check if artist name overflows, apply marquee effect
  createMarqueeEffect(artists, songThumb);

  saveCurrentSong(track, streamUrl);

}


function createSongDetails2(track, streamUrl) {
  const songThumb = document.getElementById("footer-details");
  songThumb.innerHTML = "";

  const card = document.createElement('div')
  card.classList.add('track-card-album');

  const image = document.createElement("img");
  image.src = track.image[1].url;
  image.classList.add('skeleton');
  image.classList.add('skeleton-img');

  const detailsDiv = document.createElement("div");

  const songName = document.createElement("h3");
  songName.textContent = track.name;

  const artists = document.createElement("p");
  artists.classList.add('current-song-artist');
  artists.textContent = track.artists.primary.map((artist) => artist.name).join(", ");

  detailsDiv.appendChild(songName);
  detailsDiv.appendChild(artists);
  card.appendChild(image);
  card.appendChild(detailsDiv);
  songThumb.appendChild(card);

  createMarqueeEffect(songName, detailsDiv);
  createMarqueeEffect(artists, detailsDiv);

}


async function fetchAndDisplayArtist(artistId) {
  const apiUrl = `https://jiosavan-api-with-playlist.vercel.app/api/artists/${artistId}`;

  try {
    // Fetch artist data from the API
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Extract artist details
    const artist = data?.data;
    if (!artist) {
      console.error("Artist not found.");
      return;
    }

    const { name, image, followerCount, fanCount } = artist;

    // Display artist details
    const artistContainer = document.getElementById("about-artist");
    artistContainer.innerHTML = ""; // Clear previous content

    // Create and append artist image
    const artistImage = document.createElement("img");
    artistImage.src = image[2].url;
    artistImage.alt = `${name}'s image`;
    artistContainer.appendChild(artistImage);

    // Create and append artist name
    const artistName = document.createElement("h3");
    artistName.textContent = name;
    artistContainer.appendChild(artistName);

    // Create and append followers count
    const artistFollowers = document.createElement("p");
    artistFollowers.textContent = `Followers: ${followerCount}`;
    artistContainer.appendChild(artistFollowers);

    const artistFan = document.createElement("p");
    artistFan.textContent = `FanCounts: ${fanCount}`;
    artistContainer.appendChild(artistFan);

    const followBtn = document.createElement("button");
    followBtn.textContent = "Follow"
    artistContainer.appendChild(followBtn);

  } catch (error) {
    console.error("Error fetching artist data:", error);
  }
}





let mainDiv = document.getElementById('main');

window.addEventListener("DOMContentLoaded", () => {
  playerSetItem();
  fetchRecommendations();
  displayLikedSongs();
  displayLikedSongs2(); // Display liked songs in both containers
  updateAllLikeIcons();
  loadRecentlyPlayedFromLocalStorage();

  // Display liked songs in both containers
  document.body.scrollTop = 0;
  if (navigator.onLine) {
    let mainDiv = document.getElementById("main");
    setTimeout(function () {
      mainDiv.style.display = "block";
    }, 0);
  } else {
    mainDiv.style.display = "block";
  }


  const savedSong = JSON.parse(localStorage.getItem("currentSong"));
  if (savedSong) {
    createSongDetails(savedSong, savedSong.audioUrl);
    let audioPlayer = document.getElementById("audio-player");
    audioPlayer.src = savedSong.audioUrl;
  }
});



// Search input event listener
document.getElementById("search-input").addEventListener("keyup", (event) => {
  let query = event.target.value;
  if (query.length > 0) {
    document.getElementById("recommend-title").style.display = "none";
    fetchTracks(query);
    fetchAlbums(query);
    document.getElementById("search-section").style.display = "block";
    const searchFor = document.getElementById("search-for");
    searchFor.textContent = `Songs`;
  } else {
    document.getElementById("recommend-title").style.display = "flex";
    document.getElementById("search-section").style.display = "none";

  }
});

let btnnHome = document.getElementById("btn-nhome");
document.getElementById("artist-outer").style.display = "none";

btnnHome.addEventListener("click", () => {
  document.getElementById("search-section").style.display = "none";
  document.getElementById("home-section").style.display = "block";
  document.getElementById("search-input").value = "";
  document.getElementById("btn-home").style.display = "block";
  document.getElementById("btn-nhome").style.display = "none";
  document.getElementById("recommend-title").style.display = "none";
  middleSection.scrollTop = 0;
  let leftCont = document.getElementById('left--');
  var x = window.matchMedia("(max-width: 425px)")
  if (x.matches) {
    leftCont.style.display = 'none';
  }
  middleSection.style.display = "block";
});

function homeBtnTrigger() {

  document.getElementById("btn-home").style.display = "none";
  document.getElementById("btn-nhome").style.display = "block";
  document.getElementById("home-section").style.display = "none";
  let x = window.matchMedia("(max-width: 425px)")
  let leftCont = document.getElementById('left--');
  if (x.matches) {
    leftCont.style.display = 'none';
  }
  document.getElementById("recommend-title").style.display = "flex";
  let searchInput = document.getElementById("search-input");
  if (searchInput.value == 0) {
    document.getElementById("recommend-title").style.display = "flex";
  } else {
    document.getElementById("recommend-title").style.display = "none";
  }
}



// Function to show the popup
function showPopup() {
  const popup = document.getElementById("wrapper2");
  popup.style.display = "flex";
  rightSection.style.display = "block";
}

// Function to hide the popup and set a flag in local storage
function hidePopup() {
  const popup = document.getElementById("info-popup");
  popup.style.display = "none";
  localStorage.setItem("popupShown", "true");
}



let x = window.matchMedia("(max-width: 425px)")
let rightContClose = document.getElementById('right-cont-close');
rightContClose.addEventListener("click", () => {
  if (x.matches) {
    closeBottomSheet();
  } else {
    rightSection.style.display = 'none';
  }
})


const songThumb = document.getElementById("song-thumb")



const wrapper2 = document.getElementById('wrapper2');
let isOpen = false;

// Function to open the bottom sheet
function openBottomSheet2() {
  if (isOpen) return; // Prevents multiple clicks

  // Set display to block so the element is visible before animating
  wrapper2.style.display = 'block';

  // Animate from bottom to top
  gsap.to(wrapper2, {
    y: 0,
    duration: 0.2,
    ease: "power2.out",
    onStart: function () {
      wrapper2.style.transform = 'translateY(0%)';
    }
  });

  isOpen = true;
}

// Function to close the bottom sheet
function closeBottomSheet2() {
  if (!isOpen) return; // Prevents closing if already closed

  // Animate from top to bottom
  gsap.to(wrapper2, {
    y: "100%",
    duration: 0.2,
    ease: "power2.in",
    onComplete: () => {
      // After animation is complete, hide the element again
      wrapper2.style.transform = 'translateY(100%)';
      isOpen = false;
    }
  });
}

const wrapper3 = document.getElementById('wrapper3');
const wrapper3Inner = document.getElementById('wrapper3-inner');
const headerImg = document.getElementById('header-img');

let isWrapperOpen = false; // Track if wrapper is open


// Function to open wrapper3 with background fade
function openWrapper3() {
  gsap.to(wrapper3, {
    duration: 0.2,
    left: '0%', // Bring wrapper into view
    ease: 'power2.out',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fade-in background color
  });
  isWrapperOpen = true;
  wrapper3.style.display = 'block';
}

// Function to close wrapper3 with background fade-out
function closeWrapper3() {
  gsap.to(wrapper3, {
    duration: 0.2,
    left: '-100%', // Move wrapper out of view
    ease: 'power2.in',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Fade-out background color
  });
  isWrapperOpen = false;
}

// Toggle open/close wrapper3 when clicking on header-img
headerImg.addEventListener('click', () => {

  if (isWrapperOpen) {

    closeWrapper3();

  } else {
    openWrapper3();
  }
});

// Prevent wrapper3 from closing when clicking inside wrapper3-inner
wrapper3Inner.addEventListener('click', (event) => {
  event.stopPropagation(); // Stop click event from reaching wrapper3
});

// Close wrapper when clicking on the wrapper itself (not inner)
wrapper3.addEventListener('click', closeWrapper3);



const toggleUpdateWrapper = () => {
  const wrapper = document.getElementById('update-wrapper');

  if (!isOpen) {
    // Slide in from the right
    gsap.to(wrapper, {
      duration: 0.1, // Animation duration
      x: '-100%', // Move to full width on the left side
      ease: 'power1.in', // Smooth easing
    });
  } else {
    // Slide out to the right
    gsap.to(wrapper, {
      duration: 0.1,
      x: '0%', // Move back to the right (hidden)
      ease: 'power1.in',
    });
  }

  isOpen = !isOpen; // Toggle the state
};

// Add event listener to the "What's New" button
document.getElementById('whats-new').addEventListener('click', () => {
  const wrapper = document.getElementById('update-wrapper');
  wrapper.style.display = 'block';
  closeWrapper3();
  toggleUpdateWrapper();
});

// Add event listener to the "Update Icon" button for closing
document.getElementById('update-icon').addEventListener('click', () => {
  if (isOpen) {
    toggleUpdateWrapper(); // Close the update-wrapper
  }
});






const toggleListenWrapper = () => {
  const wrapper = document.getElementById('recently-played');

  if (!isOpen) {
    // Slide in from the right
    gsap.to(wrapper, {
      duration: 0.1, // Animation duration
      x: '-100%', // Move to full width on the left side
      ease: 'power1.in', // Smooth easing
    });
  } else {
    // Slide out to the right
    gsap.to(wrapper, {
      duration: 0.1,
      x: '0%', // Move back to the right (hidden)
      ease: 'power1.in',
    });
  }

  isOpen = !isOpen; // Toggle the state
};



// Add event listener to the "What's New" button
document.getElementById('listen-history').addEventListener('click', () => {
  closeWrapper3();
  toggleListenWrapper();
  const wrapper = document.getElementById('recently-played');
  wrapper.scrollTop = 0;
  wrapper.style.display = 'block';

});

// Add event listener to the "Update Icon" button for closing
document.getElementById('recently-icon').addEventListener('click', () => {
  if (isOpen) {
    toggleListenWrapper(); // Close the update-wrapper
  }
});





const recentlyPlayedContainer = document.getElementById('recently-played-songs');

function createSongCard(track) {
  const songCard = document.createElement('div');
  songCard.classList.add('track-card');

  // Create song image
  const img = document.createElement('img');
  img.src = track.image[2].url;
  songCard.appendChild(img);

  // Create song details container
  const songDetails = document.createElement('div');
  songDetails.classList.add('song-details2');

  // Create song name
  const songName = document.createElement('h3');
  songName.textContent = track.name;
  songDetails.appendChild(songName);

  // Create artist name
  const artistName = document.createElement('p');
  artistName.textContent = track.artists.primary.map((artist) => artist.name).join(", ");
  songDetails.appendChild(artistName);

  songCard.addEventListener('click', () => {
    if (isOpen) {
      toggleListenWrapper(); // Close the update-wrapper
    }
    playSongFromApi(track.id, track);
    showPopup();
    rightSection.style.display = "block";
  })

  songCard.appendChild(songDetails);
  return songCard;
}



// Function to add a song to the recently played container
function addToRecentlyPlayed(track) {
  const songCard = createSongCard(track);

  // Add the new song at the top (most recent first)
  recentlyPlayedContainer.prepend(songCard);
  saveRecentlyPlayed(track);

}

// Function to save Recently Played songs in local storage
function saveRecentlyPlayed(track) {
  let recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];

  recentlyPlayed = recentlyPlayed.filter(item => item.id !== track.id);

  // Add the new song at the beginning of the array
  recentlyPlayed.unshift(track);

  // Limit the number of recently played songs to 10
  if (recentlyPlayed.length > 15) {
    recentlyPlayed.pop(); // Remove the oldest entry if there are more than 10 songs
  }

  // Save updated list to local storage
  localStorage.setItem('recentlyPlayed', JSON.stringify(recentlyPlayed));
}


function loadRecentlyPlayedFromLocalStorage() {
  const recentlyPlayed = JSON.parse(localStorage.getItem('recentlyPlayed')) || [];

  recentlyPlayed.forEach(track => {
    const songCard = createSongCard(track);
    recentlyPlayedContainer.appendChild(songCard);
  });
}

document.body.classList.remove('loaded');




async function fetchSongCanvas(songId) {
  try {
    const response = await fetch(`https://api.paxsenix.biz.id/spotify/canvas?id=${songId}`);
    const data = await response.json();
    // Check if a canvas URL exists
    if (data.data.canvasesList[0].canvasUrl) {
      const canvasUrl = data.data.canvasesList[0].canvasUrl;


      if (canvasUrl) {
        // Hide the song image and display the video canvas
        const videoElement = document.getElementById('canvas-player');
        videoElement.src = canvasUrl;
        document.getElementById('right-section').style.background = "#121212";
        videoElement.style.display = 'block';
        let canvasOuter = document.getElementById('canvas-outer');
        canvasOuter.style.display = 'block';
        let songThumb = document.getElementById('song-thumb');
        songThumb.style.marginTop = "40px";

      }
    }
  } catch (error) {
    let canvasOuter = document.getElementById('canvas-outer');
    canvasOuter.style.display = 'none';
    document.getElementById('canvas-player').style.display = 'none';
    songThumb.style.marginTop = "0px";

  }
}


// Register service worker in main JS file
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(function (registration) {
    console.log('Service Worker registered with scope:', registration.scope);
  }).catch(function (error) {
    console.log('Service Worker registration failed:', error);
  });
}

async function fetchAndDisplayLyrics(trackId) {
  const apiUrl = `https://jiosavan-api-with-playlist.vercel.app/api/songs/${trackId}?lyrics=true`;

  try {
    // Fetch song data from the API
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Extract the lyrics from the response
    const lyrics = data.data[0]?.lyrics?.lyrics;
    if (!lyrics) {
      console.error("Lyrics not found.");
      return;
    } else {
      document.getElementById("lyrics-outer").style.display = "block";
    }

    // Display lyrics
    const lyricsContainer = document.getElementById("lyrics-container");
    lyricsContainer.innerHTML = ""; // Clear previous content

    // Split and format lyrics
    const lines = lyrics.split(/<br\s*\/?>/);
    lines.forEach((line) => {
      const lineElement = document.createElement("p");
      lineElement.style.color = "#aaa";
      lineElement.innerHTML = line.trim();
      lyricsContainer.appendChild(lineElement);
    });
  } catch (error) {
    console.error("Error fetching lyrics:", error);
  }
}

let showLyricsBtn = document.getElementById('show-lyrics-btn');
let showLyrics = document.getElementById('show-lyrics');
showLyricsBtn.addEventListener("click", () => {
  showLyrics.style.display = "none";
})



const bottomSheet = document.getElementById("wrapper2");
const sheetContent = document.getElementById("right-section");
const closeButton = document.getElementById("right-cont-close");

let startY = 0;
let translateY = 0;
let isDragging = false;

// Open bottom sheet
const openBottomSheet = () => {
  bottomSheet.style.transform = "translateY(0)";
  bottomSheet.style.transition = "transform 0.3s ease";
  sheetContent.scrollTop = 0; // Reset scroll
};

// Close bottom sheet
const closeBottomSheet = () => {
  bottomSheet.style.transform = "translateY(100%)";
  bottomSheet.style.transition = "transform 0.3s ease";
};

// Handle close button
closeButton.addEventListener("click", () => {
  closeBottomSheet();
});

// Handle touchstart event
bottomSheet.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;

  if (sheetContent.scrollTop === 0) {
    isDragging = true;
    bottomSheet.style.transition = "none"; // Disable transition for smooth dragging
  }
});

// Handle touchmove event
bottomSheet.addEventListener("touchmove", (e) => {
  const currentY = e.touches[0].clientY;
  const diffY = currentY - startY;

  if (isDragging) {
    if (diffY > 0) {
      // Dragging down
      translateY = diffY;
      bottomSheet.style.transform = `translateY(${translateY}px)`;

      if (e.cancelable) {
        e.preventDefault(); // Prevent scrolling during dragging
      }
    }
  } else {
    if (sheetContent.scrollTop === 0 && diffY > 0) {
      // Switch to dragging if user pulls down at the top
      isDragging = true;
      startY = currentY;
      if (e.cancelable) {
        e.preventDefault(); // Prevent pull-to-refresh
      }
    }
  }
});

// Handle touchend event
bottomSheet.addEventListener("touchend", () => {
  if (isDragging) {
    if (translateY > 150) {
      // Close sheet if dragged down significantly
      closeBottomSheet();
    } else {
      // Reset position if drag distance is small
      bottomSheet.style.transform = "translateY(0)";
      bottomSheet.style.transition = "transform 0.3s ease";
    }
    isDragging = false;
    translateY = 0;
  }
});

// Allow content scrolling inside the bottom sheet
sheetContent.addEventListener("touchmove", (e) => {
  if (sheetContent.scrollTop > 0) {
    // Allow normal scrolling
    e.stopPropagation();
  } else if (e.cancelable && e.touches[0].clientY > startY) {
    // Prevent pull-to-refresh when at the top and scrolling down
    e.preventDefault();
  }
});

// Open bottom sheet on some action (e.g., a song click)
document.getElementById("footer").addEventListener("click", () => {
  openBottomSheet();
});



var audioPlayer = document.getElementById("audio-player");
const playPauseBtn = document.getElementById("play-pause-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressBar = document.getElementById("progress-bar");
const currentTimeElem = document.getElementById("current-time");
const totalDurationElem = document.getElementById("total-duration");
const footerPlay = document.getElementById("footer-play");
const footerFor = document.getElementById("footer-for");

var audioPlayer3 = document.getElementById("audio-player");
const playPauseBtn2 = document.getElementById("play-pause-btn2");
const prevBtn2 = document.getElementById("prev-btn2");
const nextBtn2 = document.getElementById("next-btn2");
const progressBar2 = document.getElementById("progress-bar2");
const currentTimeElem2 = document.getElementById("current-time2");
const totalDurationElem2 = document.getElementById("total-duration2");
const repeatIcon2 = document.getElementById("repeat-icon2");
const suffleIco = document.getElementById("shuffle-ico2");

suffleIco.addEventListener("click", () => {
  isShuffle = !isShuffle;
  playedSongs.clear();
  suffleIco.style.color = isShuffle ? "#1DB954" : "#FFFFFF";
});

// Stop propagation of scroll events when adjusting the range slider
progressBar2.addEventListener('mousedown', (event) => {
  event.stopPropagation(); // Prevents parent scroll from triggering
});

progressBar2.addEventListener('touchstart', (event) => {
  event.stopPropagation(); // Prevents parent scroll for touch devices
});

// Optional: Prevent default behavior of scrolling the page while dragging
progressBar2.addEventListener('mousemove', (event) => {
  event.stopPropagation();
});

function disableAudioPlayer() {
  audioPlayer.style.pointerEvents = "none"; // Disable pointer events
  playPauseBtn.style.pointerEvents = "none"; // Disable pointer events
  prevBtn.style.pointerEvents = "none"; // Disable pointer events
  nextBtn.style.pointerEvents = "none"; // Disable pointer events
  progressBar.style.opacity = "none"; // Optional: dim the audio tag for visual feedback
  currentTimeElem.style.pointerEvents = "none"; // Disable pointer events
  totalDurationElem.style.opacity = "none"; // Optional: dim the audio tag for visual feedback
  audioPlayer.style.pointerEvents = "0.5"; // Disable pointer events
  playPauseBtn.style.pointerEvents = "0.5";
  prevBtn.style.pointerEvents = "0.5"; // Disable pointer events
  progressBar.style.opacity = "0.5"; // Optional: dim the audio tag for visual feedback
  currentTimeElem.style.pointerEvents = "0.5"; // Disable pointer events
  totalDurationElem.style.opacity = "0.5"; // Optional: dim the audio tag for visual feedback
}
function disableAudioPlayer2() {
  audioPlayer3.style.pointerEvents = "none"; // Disable pointer events
  playPauseBtn2.style.pointerEvents = "none"; // Disable pointer events
  prevBtn2.style.pointerEvents = "none"; // Disable pointer events
  nextBtn2.style.pointerEvents = "none"; // Disable pointer events
  progressBar2.style.opacity = "none"; // Optional: dim the audio tag for visual feedback
  currentTimeElem2.style.pointerEvents = "none"; // Disable pointer events
  totalDurationElem2.style.opacity = "none"; // Optional: dim the audio tag for visual feedback
  audioPlayer3.style.pointerEvents = "0.5"; // Disable pointer events
  playPauseBtn2.style.pointerEvents = "0.5";
  prevBtn2.style.pointerEvents = "0.5"; // Disable pointer events
  nextBtn2.style.pointerEvents = "0.5"; // Disable pointer events
  progressBar2.style.opacity = "0.5"; // Optional: dim the audio tag for visual feedback
  currentTimeElem2.style.pointerEvents = "0.5"; // Disable pointer events
  totalDurationElem2.style.opacity = "0.5"; // Optional: dim the audio tag for visual feedback
}

function enableAudioPlayer() {
  audioPlayer.style.pointerEvents = "auto"; // Disable pointer events
  playPauseBtn.style.pointerEvents = "auto"; // Disable pointer events
  prevBtn.style.pointerEvents = "auto"; // Disable pointer events
  nextBtn.style.pointerEvents = "auto"; // Disable pointer events
  progressBar.style.opacity = "auto"; // Optional: dim the audio tag for visual feedback
  currentTimeElem.style.pointerEvents = "auto"; // Disable pointer events
  totalDurationElem.style.opacity = "auto"; // Optional: dim the audio tag for visual feedback
  audioPlayer.style.pointerEvents = "1"; // Disable pointer events
  playPauseBtn.style.pointerEvents = "1";
  prevBtn.style.pointerEvents = "1"; // Disable pointer events
  nextBtn.style.pointerEvents = "1"; // Disable pointer events
  progressBar.style.opacity = "1"; // Optional: dim the audio tag for visual feedback
  currentTimeElem.style.pointerEvents = "1"; // Disable pointer events
  totalDurationElem.style.opacity = "1";
}
function enableAudioPlayer2() {
  audioPlayer3.style.pointerEvents = "auto"; // Disable pointer events
  playPauseBtn2.style.pointerEvents = "auto"; // Disable pointer events
  prevBtn2.style.pointerEvents = "auto"; // Disable pointer events
  nextBtn2.style.pointerEvents = "auto"; // Disable pointer events
  progressBar2.style.opacity = "auto"; // Optional: dim the audio tag for visual feedback
  currentTimeElem2.style.pointerEvents = "auto"; // Disable pointer events
  totalDurationElem2.style.opacity = "auto"; // Optional: dim the audio tag for visual feedback
  audioPlayer3.style.pointerEvents = "1"; // Disable pointer events
  playPauseBtn2.style.pointerEvents = "1";
  prevBtn2.style.pointerEvents = "1"; // Disable pointer events
  nextBtn2.style.pointerEvents = "1"; // Disable pointer events
  progressBar2.style.opacity = "1"; // Optional: dim the audio tag for visual feedback
  currentTimeElem2.style.pointerEvents = "1"; // Disable pointer events
  totalDurationElem2.style.opacity = "1";
}

disableAudioPlayer();

repeatIcon2.addEventListener('click', () => {
  if (isRepeat) {
    // Disable repeat
    isRepeat = false;
    repeatIcon2.className = 'ri-repeat-2-fill';
    audioPlayer3.loop = false;
  } else {
    // Enable repeat
    isRepeat = true;
    repeatIcon2.className = 'ri-repeat-one-fill';
    audioPlayer3.loop = true;
  }
});


// Play or pause the song
playPauseBtn.addEventListener("click", () => {
  if (audioPlayer.paused) {
    audioPlayer.play();
    playPauseBtn.className = "ri-pause-large-line";
    playPauseBtn2.className = "ri-pause-large-line";
    footerPlay.className = "ri-pause-large-line";
  } else {
    audioPlayer.pause();
    playPauseBtn.className = "ri-play-fill";
    playPauseBtn2.className = "ri-play-fill";
    footerPlay.className = "ri-play-fill";
  }
});
// Play or pause the song
playPauseBtn2.addEventListener("click", () => {
  if (audioPlayer3.paused) {
    audioPlayer3.play();
    playPauseBtn2.className = "ri-pause-large-line";
    playPauseBtn.className = "ri-pause-large-line";
    footerPlay.className = "ri-pause-large-line";
  } else {
    audioPlayer3.pause();
    playPauseBtn2.className = "ri-play-fill";
    playPauseBtn.className = "ri-play-fill";
    footerPlay.className = "ri-play-fill";
  }
});

// Play the previous song
prevBtn.addEventListener("click", () => {
  currentSongIndex--;
  playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
});
// Play the previous song
prevBtn2.addEventListener("click", () => {
  currentSongIndex--;
  playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
});

footerPlay.addEventListener("click", (event) => {
  event.stopPropagation();
  if (audioPlayer3.paused) {
    audioPlayer3.play();
    playPauseBtn2.className = "ri-pause-line";
    playPauseBtn.className = "ri-pause-line";
    footerPlay.className = "ri-pause-line";
  } else {
    audioPlayer3.pause();
    playPauseBtn2.className = "ri-play-fill";
    playPauseBtn.className = "ri-play-fill";
    footerPlay.className = "ri-play-fill";
  }
});


// Play the next song
nextBtn.addEventListener("click", () => {
  if (currentSongIndex < songQueue.length - 1) {
    currentSongIndex++;
    playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
  } else {
    currentSongIndex = 0;
    playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
  }
});
// Play the next song
nextBtn2.addEventListener("click", () => {
  if (currentSongIndex < songQueue.length - 1) {
    currentSongIndex++;
    playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
  } else {
    currentSongIndex = 0;
    playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
  }
});

footerFor.addEventListener("click", () => {
  if (currentSongIndex < songQueue.length - 1) {
    currentSongIndex++;
    playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
  }
});

// Update the progress bar as the song plays
audioPlayer.addEventListener("timeupdate", () => {
  const currentTime = audioPlayer.currentTime;
  const duration = audioPlayer.duration;

  progressBar.value = (currentTime / duration) * 100 || 0;
  progressBar.style.background = `linear-gradient(to right, white ${progressBar2.value}%, #535353 ${progressBar.value}%)`;
  currentTimeElem.textContent = formatTime(currentTime);
  totalDurationElem.textContent = formatTime(duration);
});
// Update the progress bar as the song plays
audioPlayer3.addEventListener("timeupdate", () => {
  const currentTime2 = audioPlayer3.currentTime;
  const duration2 = audioPlayer3.duration;

  progressBar2.value = (currentTime2 / duration2) * 100 || 0;
  progressBar2.style.background = `linear-gradient(to right, white ${progressBar2.value}%, rgba(0, 0, 0, 0.4) ${progressBar2.value}%)`;
  currentTimeElem2.textContent = formatTime(currentTime2);
  totalDurationElem2.textContent = formatTime(duration2);
});

// Seek functionality
progressBar.addEventListener("input", () => {
  const duration = audioPlayer.duration;
  const seekTime = (progressBar.value / 100) * duration;
  audioPlayer.currentTime = seekTime;
});
// Seek functionality
progressBar2.addEventListener("input", () => {
  const duration = audioPlayer3.duration;
  const seekTime = (progressBar2.value / 100) * duration;
  audioPlayer3.currentTime = seekTime;
});

// Format time in mm:ss
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

function playerSetItem() {
  if (x.matches) {
    document.getElementById('player-container2').style.display = 'flex';
    document.getElementById('player-container').style.display = 'none';
  } else {
    document.getElementById('player-container').style.display = 'flex';
    document.getElementById('player-container2').style.display = 'none';
  }
}

const rangeInput = document.querySelector('.progress-bar2');

function updateRangeBackground() {
  const value = rangeInput.value;
  const max = rangeInput.max;
  const percentage = (value / max) * 100; // Calculate percentage
  // Update the gradient to match the filled portion
  rangeInput.style.background = `linear-gradient(to right, white ${percentage}%, #535353 ${percentage}%)`;
}

// Initialize the filled track on page load
updateRangeBackground();

// Update the filled track when the user interacts with the slider
rangeInput.addEventListener('input', updateRangeBackground);

const timerButton = document.getElementById("timer-btn");
const timerSheet = document.getElementById("timer-sheet");
const closeTimerButton = document.getElementById("close-timer");
const timerOptions = document.querySelectorAll(".timer-option");
let isTimerSelected = false;
let timerId = null; // Store the timer ID for clearing later


// Ensure "None" is selected initially
document.addEventListener("DOMContentLoaded", () => {
  const noneOption = document.querySelector('.timer-option[data-time="0"]');
  noneOption.classList.add("selected");
});

// Show Bottom Sheet
timerButton.addEventListener("click", (event) => {
  timerSheet.classList.add("active");
  event.stopPropagation(); // Prevent propagation to document click listener
});

// Close Bottom Sheet
closeTimerButton.addEventListener("click", () => {
  hideBottomSheet();
});

// Stop propagation for clicks inside the bottom sheet
timerSheet.addEventListener("click", (event) => {
  event.stopPropagation();
});

// Close Bottom Sheet when clicking outside
document.addEventListener("click", () => {
  hideBottomSheet();
});

// Close Bottom Sheet Function
function hideBottomSheet() {
  timerSheet.classList.remove("active");
}

// Timer logic
timerOptions.forEach((option) => {
  option.addEventListener("click", () => {
    // Remove 'selected' class from all options
    timerOptions.forEach((opt) => opt.classList.remove("selected"));

    // Add 'selected' class to the clicked option
    option.classList.add("selected");

    // Handle "None" option
    const selectedTime = parseInt(option.dataset.time, 10);
    if (selectedTime === 0) {
      resetTimer();
    } else {
      setTimer(selectedTime);
    }
  });
});

// Reset Timer Function
function resetTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  isTimerSelected = false;
  timerButton.style.color = "white"; // Reset timer button color
}

// Set Timer Function
function setTimer(minutes) {
  isTimerSelected = true;
  timerButton.style.color = "#1db954"; // Spotify theme green

  // Clear any existing timer
  if (timerId) clearTimeout(timerId);

  // Set a new timer to pause the audio
  timerId = setTimeout(() => {
    audioPlayer.pause(); // Pause audio
    playPauseBtn.className = "ri-play-fill";
    playPauseBtn2.className = "ri-play-fill";
    footerPlay.className = "ri-play-fill";

    resetTimer();
    const noneOption = document.querySelector('.timer-option[data-time="0"]');
    noneOption.classList.add("selected"); // Default to "None"
  }, minutes * 60 * 1000); // Convert minutes to milliseconds
}




const volumeIcon = document.getElementById("volume-icon");

let volumeState = "up"; // Initial volume state: up, down, or mute

// Set initial volume to 100%
audioPlayer.volume = 1;

// Volume control logic
volumeIcon.addEventListener("click", () => {
  if (volumeState === "up") {
    // Change to volume down
    volumeState = "down";
    audioPlayer.volume = 0.5; // Set volume to 50%
    volumeIcon.className = "ri-volume-down-line"; // Update icon
  } else if (volumeState === "down") {
    // Change to mute
    volumeState = "mute";
    audioPlayer.volume = 0; // Set volume to 0%
    volumeIcon.className = "ri-volume-mute-line"; // Update icon
  } else if (volumeState === "mute") {
    // Change back to volume up
    volumeState = "up";
    audioPlayer.volume = 1; // Set volume to 100%
    volumeIcon.className = "ri-volume-up-line"; // Updatri-pause-large-line
  }
})




function updateMediaSession(track) {

  // Update Media Metadata
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artists.primary[0].name,
      album: "Album",
      artwork: [
        { src: track.image[2].url, sizes: "500x500", type: "image/webp" }, 
      ]
    });

    navigator.mediaSession.setActionHandler("play", () => {
      audioPlayer.play();
      playPauseBtn2.className = "ri-pause-line";
      playPauseBtn.className = "ri-pause-line";
      footerPlay.className = "ri-pause-line";
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioPlayer.pause();
      playPauseBtn2.className = "ri-play-fill";
      playPauseBtn.className = "ri-play-fill";
      footerPlay.className = "ri-play-fill";
    });

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (currentSongIndex < songQueue.length - 1) {
        currentSongIndex++;
        playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
      } else {
        currentSongIndex = 0;
        playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
      }
    });

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      currentSongIndex--;
      playSongFromApi(songQueue[currentSongIndex].id, songQueue[currentSongIndex]);
    });

  }
}