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


// Default song ID to use when recommended tracks = 0 or on the first visit
const defaultSongId = "0biuGbhZwYnuUwMOi4fvaN";

async function playSongFromApi(songId, track) {
  let apiUrl = `https://saavn.dev/api/songs/${songId}`;
            
  const audioPlayer = document.getElementById("audio-player");

  try {
    const loadingSpinner = document.getElementById("loading-spinner");
    const loadingSpinner2 = document.getElementById("loading-outer");
    loadingSpinner.style.display = "block";
    loadingSpinner2.style.display = 'flex'
    const videoElement = document.getElementById('canvas-player');
               

    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      const streamUrl = data.data[0].downloadUrl[2].url;

      loadingSpinner.style.display = "none";
      loadingSpinner2.style.display = "none";
      audioPlayer.src = streamUrl;
      audioPlayer.play();
      
      createSongDetails(track, streamUrl);
      fetchAndDisplayLyrics(track.id);
      
      
      if(track){
        document.title = `${track.name} • ${track.artists.primary[0].name}`;
      }

      audioPlayer.addEventListener('play', () => {
        videoElement.play();


    });

    // Pause video when audio pauses
    audioPlayer.addEventListener('pause', () => {
        videoElement.pause();
    });

    // Pause video when audio ends
    audioPlayer.addEventListener('ended', () => {
        videoElement.pause();
    });
      
      document.getElementById('dYnaPI').style.fill = '#1db954';
      setBackgroundColorFromImage(track);
      addToRecentlyPlayed(track); // Show the video player
      
      function setBackgroundColorFromImage(imageUrl) {
        const colorThief = new ColorThief();
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Ensure the image is fetched with CORS support
        img.src = track.image[2].url;
      
        img.onload = function() {
          // Extract the dominant color
          const dominantColor = colorThief.getPalette(img, 10);

          const secondArray = dominantColor[3];

          const darkColor = darkenColor(secondArray);
          
          // Convert RGB array to CSS color
         const rgbColor = `rgb(${darkColor[0]}, ${darkColor[1]}, ${darkColor[2]})`;

         const gradientBackground = `linear-gradient(to bottom, ${rgbColor} 20%, rgb(0,0,0) 115%)`;
          
          // Set the background color of the right section
          document.getElementById('right-section').style.background = rgbColor;
        };
      
        img.onerror = function() {
          console.log("Error loading image for color extraction");
        };
      }
      
    } else {
      alert("This song is not available for this region.");
      loadingSpinner.style.display = "none";
      var x = window.matchMedia("(max-width: 425px)") 
        if(x.matches){
          closeBottomSheet()

       }else{
        rightSection.style.display = 'none';
       }
    }
  } catch (error) {
    console.error("Error fetching the audio stream:", error);
  }
}


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
    `https://saavn.dev/api/search/songs?query=${encodeURIComponent(
      query
    )}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  console.log(data.data.results);
  
  displayTracks(data.data.results);
}


// Function to Display Tracks
function displayTracks(tracks) {
  const container = document.getElementById("tracks-container");
  container.innerHTML = "";
  songQueue = tracks;

  tracks.forEach((track, index) => {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const image = document.createElement("img");
    image.src = track.image[2].url;

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
      currentIndex = index;
      let showLyrics = document.getElementById('show-lyrics');
      showLyrics.style.display = "flex";
      const audioAd = document.getElementById("audio-ad");
      const audioPlayer = document.getElementById("audio-player");

      playSongFromApi(track.id, track);
      showPopup();
      openBottomSheet();
      rightSection.style.display = "block";
    });

    container.appendChild(card);
  });
}


// Function to play the next song
function playNextSong() {
  currentIndex++;
  if (currentIndex < songQueue.length) {
    playSong(songQueue[currentIndex]);
  } else {
    console.log("End of queue, fetching more recommendations...");
  }
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
      playSongFromApi(track.external_urls.spotify, track);
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
    if(track){
      if(x.matches){
        document.getElementById('liked-outer').style.display = 'block';
      }
    }

    const card = document.createElement("div");
    card.classList.add("track-card");

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
      if(!track){
        document.getElementById('liked-outer').style.display = 'none';
      }  // Remove the song from liked songs
    });

    card.appendChild(image);
    songInfo.appendChild(songName);
    songInfo.appendChild(artists);
    card.appendChild(songInfo);
    card.appendChild(deleteIcon);

    card.addEventListener("click", () => {
      playSongFromApi(track.external_urls.spotify, track);
      showPopup();
      openBottomSheet();
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


const albumId = '2HKS1DAJvHmsYs2ORrMQE1';
// Function to Fetch Recommended Tracks Based on Selected Track or Default Song
async function fetchRecommendations(trackId) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/albums/${albumId}/tracks`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  console.log(data)
}


// Function to Fetch Recommended Tracks Based on Selected Track or Default Song
async function fetchArtistRecommendations(trackId = defaultArtistId) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${trackId}/related-artists`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } 
  );

  const data = await response.json();
}

// Function to Fetch Recommended Tracks Based on Selected Track or Default Song
async function fetchArtist(trackId) {
  const token = await getAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${artistId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAccessToken}`,
      },
    } 
  );

  const data = await response.json();
  console.log(data) 
}

// Display artists in the artist-container with images and names
function displayArtists(artists) {
  const artistContainer = document.getElementById('artist-container');
  artistContainer.innerHTML = ''; // Clear existing artists

  artists.forEach(artist => {
    const artistCard = document.createElement('div');
    artistCard.classList.add('track-card');

    artistCard.innerHTML = `
      <img src="${artist.images[0].url}">
      <div class="song-details">
        <h3>${artist.name}</h3>
        <p>${artist.type.toUpperCase()}</p>
      </div>
    `;
    artistContainer.appendChild(artistCard);
  });
}



// Function to Display Recommended Tracks

function displayRecommendations(tracks) {
  const container = document.getElementById("recommendations-container");
  container.innerHTML = "";

  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.classList.add("track-card");

    const image = document.createElement("img");
    image.src = track.images[0].url;
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
      handleRecommendationLike(track, likeIcon);
    });

    card.appendChild(image);
    card.appendChild(songName);
    card.appendChild(artists);
    card.appendChild(likeIcon);

    card.addEventListener("click", () => {
      const audioAd = document.getElementById("audio-ad");
      const audioPlayer = document.getElementById("audio-player");
      audioPlayer.src = '';
      let adAudioUrls = ["audio/spodcast_ad.mp3", "audio/spodcast_ad2.mp3","audio/spodcast_ad3.mp3"];
      const videoAd = document.getElementById('video-ad');
      const videoPlayer = document.getElementById('video-player');

      function getRandomAd() {
        const randomIndex = Math.floor(Math.random() * adAudioUrls.length);
        return adAudioUrls[randomIndex];
      }  
       
      function disableAudioPlayer() {
        audioPlayer.style.pointerEvents = "none"; // Disable pointer events
        audioPlayer.style.opacity = "0.5"; // Optional: dim the audio tag for visual feedback
      }
      
      // Function to enable interaction with the song audio tag
      function enableAudioPlayer() {
        audioPlayer.style.pointerEvents = "auto"; // Re-enable pointer events
        audioPlayer.style.opacity = "1"; // Restore original opacity
      }

      const playAd = () => {
        videoAd.style.display = "block";
        videoPlayer.play();
        const randomAdUrl = getRandomAd();
        // Set the audio source to the ad audio
        audioAd.src = randomAdUrl;
        audioAd.play();
        audioAd.loop = false;
        playSongFromApi(track.external_urls.spotify, track);
        audioPlayer.pause();
        disableAudioPlayer();
  
        // When the ad finishes, switch to the song
        audioAd.onended = function() {
          videoAd.style.display = "none"
          audioPlayer.play();
          audioPlayer.loop = true;
          enableAudioPlayer();
        };
      }
      playAd();
        
      showPopup();
      openBottomSheet();
      rightSection.style.display = "block";
      document.getElementById('lyrics-outer').style.display = "none";
    });

    container.appendChild(card);
  });
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
  displayLikedSongs2(); // Display liked songs in both containers
  updateAllLikeIcons();
  loadRecentlyPlayedFromLocalStorage();
  displayRecommendations(recommendedSongs);
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
  let leftCont = document.getElementById('left--');
  var x = window.matchMedia("(max-width: 425px)") 
  if(x.matches){
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
  if(x.matches){
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


let x = window.matchMedia("(max-width: 425px)")
let rightContClose = document.getElementById('right-cont-close');
rightContClose.addEventListener("click", () => {
  if(x.matches){
    closeBottomSheet();
    const headerCell = document.getElementById('header-cell');
    headerCell.style.display = "block";
  }else{
    rightSection.style.display = 'none';
  }
})


const songThumb = document.getElementById("song-thumb")

const headerCell = document.getElementById('header-cell');
headerCell.addEventListener('click', () => {
  headerCell.style.display = "none";
  if(songThumb.innerHTML){
    const popup = document.getElementById('wrapper2');
    popup.style.display = 'block';
    openBottomSheet();
  }else{
    alert("No song found!")
 }
})



const wrapper2 = document.getElementById('wrapper2');
let isOpen = false;

// Function to open the bottom sheet
function openBottomSheet() {
  if (isOpen) return; // Prevents multiple clicks

  // Set display to block so the element is visible before animating
  wrapper2.style.display = 'block';

  // Animate from bottom to top
  gsap.to(wrapper2, {
    y: 0,
    duration: 0.2,
    ease: "power2.out",
    onStart: function() {
      wrapper2.style.transform = 'translateY(0%)';
    }
  });

  isOpen = true;
}

// Function to close the bottom sheet
function closeBottomSheet() {
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
    openBottomSheet();
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
  navigator.serviceWorker.register('/sw.js').then(function(registration) {
    console.log('Service Worker registered with scope:', registration.scope);
  }).catch(function(error) {
    console.log('Service Worker registration failed:', error);
  });
}

async function fetchAndDisplayLyrics(trackId) {
  const apiUrl = `https://saavn.dev/api/songs/${trackId}?lyrics=true`;

  try {
    // Fetch song data from the API
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log(data.data[0].lyrics.lyrics)

    // Extract the lyrics from the response
    const lyrics = data.data[0]?.lyrics?.lyrics;
    if (!lyrics) {
      console.error("Lyrics not found.");
      return;
    }else{
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







const rightContainer = document.getElementById('right-section');
const topTitle = document.getElementById('top-title');

// Add scroll event listener
rightContainer.addEventListener('scroll', () => {
    if (rightContainer.scrollTop > 30) {
        topTitle.classList.add('scrolled');
    } else {
        topTitle.classList.remove('scrolled');
    }
});

let showLyricsBtn = document.getElementById('show-lyrics-btn');
let showLyrics = document.getElementById('show-lyrics');
showLyricsBtn.addEventListener("click",() => {
     showLyrics.style.display = "none";
})
