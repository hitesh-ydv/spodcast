const client_id = "4fed9d932c7840a292b8f10a34a8a892";
const client_secret = "fa138e9b886743a9970fccbad0bf5150";
let likedSongs = JSON.parse(localStorage.getItem("likedSongs")) || [];
let recommendedSongs =
  JSON.parse(localStorage.getItem("recommendedSongs")) || [];
let currentSong = JSON.parse(localStorage.getItem("currentSong")) || null;
let rightSection = document.getElementById("right-section");

rightSection.style.display = "none";

let middleSection = document.getElementById('middle-section');


// Default song ID to use when recommended tracks = 0 or on the first visit
const defaultSongId = "30m1Wyp7zzpOYsBqvM7gYM";


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
async function fetchTracks(query) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(
      query
    )}&type=track&market=IN`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  displayTracks(data.tracks.items);
}


// Function to Display Tracks
function displayTracks(tracks) {
  const container = document.getElementById("tracks-container");
  container.innerHTML = "";

  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const image = document.createElement("img");
    image.src = track.album.images[0]?.url || "default-image-url";
    image.alt = track.name;

    const songName = document.createElement("h3");
    songName.textContent = track.name;

    const artists = document.createElement("p");
    artists.textContent = track.artists.map((artist) => artist.name).join(", ");

    const likeIcon = document.createElement("i");
    likeIcon.classList.add("ri-add-circle-line", "liked-icon");

    // Check if the song is already liked
    if (isSongLiked(track.id)) {
      likeIcon.classList.replace("ri-add-circle-line", "ri-check-line");
    }

    likeIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLikeSong(track);
      updateLikeIcon(likeIcon, track.id);
    });

    card.appendChild(image);
    card.appendChild(songName);
    card.appendChild(artists);
    card.appendChild(likeIcon);

    card.addEventListener("click", () => {
      playSongFromApi(track.id, track);
      fetchRecommendations(track.id);
      showPopup();
      rightSection.style.display = "block";
    });

    container.appendChild(card);
  });
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
}


// Function to update like icon
function updateLikeIcon(icon, trackId) {
  if (isSongLiked(trackId)) {
    icon.classList.replace("ri-add-circle-line", "ri-check-line");
  } else {
    icon.classList.replace("ri-check-line", "ri-add-circle-line");
  }
}


// Check if song is liked
function isSongLiked(id) {
  return likedSongs.some((song) => song.id === id);
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
    image.src = track.album.images[0]?.url || "default-image-url";
    image.alt = track.name;

    const songName = document.createElement("h4");
    songName.textContent = track.name;

    const artists = document.createElement("p");
    artists.textContent = track.artists.map((artist) => artist.name).join(", ");

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


// Function to Fetch and Play Song Audio from External API

async function playSongFromApi(songId, track) {
  const apiUrl = `https://paxsenix.serv00.net/v1/spotify.php?stream=${songId}&serv=yt`;
  const audioPlayer = document.getElementById("audio-player");

  try {
    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "block";

    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      const streamUrl = data.url;

      loadingSpinner.style.display = "none";
      audioPlayer.src = streamUrl;
      audioPlayer.play();
      createSongDetails(track, streamUrl);
    } else {
      alert("Audio stream not available for this track.");
    }
  } catch (error) {
    console.error("Error fetching the audio stream:", error);
    alert("Failed to load the audio stream.");
    const loadingSpinner = document.getElementById("loading-spinner");
    loadingSpinner.style.display = "none";
  }
}


// Function to Save Current Song to Local Storage
function saveCurrentSong(track, streamUrl) {
  const songData = {
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => artist.name).join(", "),
    image: track.album.images[0]?.url || "default-image-url",
    audioUrl: streamUrl,
  };
  localStorage.setItem("currentSong", JSON.stringify(songData));
}



// Function to Fetch Recommended Tracks Based on Selected Track or Default Song
async function fetchRecommendations(trackId = defaultSongId) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&market=IN`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  displayRecommendations(data.tracks);
  localStorage.setItem("recommendedSongs", JSON.stringify(data.tracks));
}


// Function to Display Recommended Tracks

function displayRecommendations(tracks) {
  const container = document.getElementById("recommendations-container");
  container.innerHTML = "";

  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const image = document.createElement("img");
    image.src = track.album.images[0]?.url || "default-image-url";
    image.alt = track.name;

    const songName = document.createElement("h3");
    songName.textContent = track.name;

    const artists = document.createElement("p");
    artists.textContent = track.artists.map((artist) => artist.name).join(", ");

    const likeIcon = document.createElement("i");
    likeIcon.classList.add("ri-add-circle-line", "liked-icon");

    if (isSongLiked(track.id)) {
      likeIcon.classList.replace("ri-add-circle-line", "ri-check-line");
    }

    likeIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLikeSong(track);
      updateLikeIcon(likeIcon, track.id);
    });

    card.appendChild(image);
    card.appendChild(songName);
    card.appendChild(artists);
    card.appendChild(likeIcon);

    card.addEventListener("click", () => {
      showPopup();
      rightSection.style.display = "block";
      playSongFromApi(track.id, track);
    });

    container.appendChild(card);
  });
}



// Function to Save and Display Song Details in Song Thumb Container

function createSongDetails(track, streamUrl) {
  const songThumb = document.getElementById("song-thumb");
  songThumb.innerHTML = "";

  const image = document.createElement("img");
  image.src = track.album.images[0].url;
  image.alt = track.name;

  const detailsDiv = document.createElement("div");
  detailsDiv.classList.add("song-details2");

  const songName = document.createElement("h3");
  songName.textContent = track.name;

  const artists = document.createElement("p");
  artists.textContent = track.artists.map((artist) => artist.name).join(", ");

  detailsDiv.appendChild(songName);
  detailsDiv.appendChild(artists);
  songThumb.appendChild(image);
  songThumb.appendChild(detailsDiv);

  saveCurrentSong(track, streamUrl);
}


document.oncontextmenu = function() {
  return false;
}


// Function to Check First Visit
function isFirstVisit() {
  return !localStorage.getItem("visited");
}


// Function to Check if No Recommended Songs
function hasNoRecommendedSongs() {
  return recommendedSongs.length === 0;
}



// Function to handle UI based on first visit or no recommendations
function handleInitialUI() {
  const recommendTitle = document.getElementById("recommend-title");
  const homeSection = document.getElementById("home-section");

  if (isFirstVisit() || hasNoRecommendedSongs()) {
    fetchRecommendations(defaultSongId);
    homeSection.style.display = "block";
  } else {
    homeSection.style.display = "block";
  }

  localStorage.setItem("visited", "true");
}

let mainDiv = document.getElementById('main');

// Call handleInitialUI function on page load
window.addEventListener("DOMContentLoaded", () => {
  handleInitialUI();
  displayLikedSongs();
  document.body.scrollTop = 0;
  if (navigator.onLine) {
    let mainDiv = document.getElementById("main");
    setTimeout(function () {
      mainDiv.style.display = "block";
    }, 1500);
  } else {
    mainDiv.style.display = "block";
  }

  if (recommendedSongs.length > 0) {
    displayRecommendations(recommendedSongs);
  }

  const savedSong = JSON.parse(localStorage.getItem("currentSong"));
  if (savedSong) {
    createSongDetails(savedSong, savedSong.audioUrl);
    const audioPlayer = document.getElementById("audio-player");
    audioPlayer.src = savedSong.audioUrl;
  }
});



// Search input event listener
document.getElementById("search-input").addEventListener("keyup", (event) => {
  let query = event.target.value;
  if (query.length > 0) {
    document.getElementById("recommend-title").style.display = "none";
    fetchTracks(query);
    document.getElementById("search-section").style.display = "block";
    const searchFor = document.getElementById("search-for");
    searchFor.textContent = `Search from '${query}'`;
  } else {
    document.getElementById("recommend-title").style.display = "flex";
    document.getElementById("search-section").style.display = "none";
  }
});

let btnnHome = document.getElementById("btn-nhome");

btnnHome.addEventListener("click", () => {
  document.getElementById("search-section").style.display = "none";
  document.getElementById("home-section").style.display = "block";
  document.getElementById("search-input").value = "";
  document.getElementById("btn-home").style.display = "block";
  document.getElementById("btn-nhome").style.display = "none";
  document.getElementById("recommend-title").style.display = "none";
  middleSection.scrollTop = 0;
  leftCont.style.display = 'none';
  middleSection.style.display = "block";
});

function homeBtnTrigger() {
  
  document.getElementById("btn-home").style.display = "none";
  document.getElementById("btn-nhome").style.display = "block";
  document.getElementById("home-section").style.display = "none";
  leftCont.style.display = 'none';
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


function showPopupform() {
  const popup = document.getElementById("wrapper");
  popup.style.display = "flex";
}

// Check if the popup has been shown before
window.addEventListener("DOMContentLoaded", () => {
  const popupShown = localStorage.getItem("popupShown");

  // Add event listener to the OK button
  const okButton = document.getElementById("ok-button");
  okButton.addEventListener("click", hidePopup);
});


let rightContClose = document.getElementById('right-cont-close');
rightContClose.addEventListener("click", () => {
  rightSection.style.display = 'none';
  const popup = document.getElementById("wrapper2");
  popup.style.display = 'none';
})


const headerCell = document.getElementById('header-cell');
headerCell.addEventListener('click', () => {
  
  const songThumb = document.getElementById("song-thumb");
  
  if(songThumb.innerHTML){
    const popup = document.getElementById("wrapper2");
    popup.style.display = "flex";
    rightSection.style.display = "block";
  }else{
    alert("No song found!")
 }
})


let likedIcon = document.getElementById('liked-icon');
let leftCont = document.getElementById('left--');

likedIcon.addEventListener('click', () => {
  middleSection.style.display = "none";
  leftCont.style.display = 'block';
  document.getElementById("btn-home").style.display = "none";
  document.getElementById("btn-nhome").style.display = "block";
})