'use strict';

var Video = require('twilio-video');

var activeRoom;
var previewTracks;
var identity;
var roomName;
var trackMode='all';
var mute = false;
var showVideo=true;
var randomName = require('./randomname');

let toogleAudio = function (room) {
    if (!mute) {
        room.localParticipant.audioTracks.forEach(function (track) {
                track.disable();
            }
        )
        mute = true;
        $('#mute').text("Un Mute");
    }
    else {
        room.localParticipant.audioTracks.forEach(function (track) {
                track.enable();
            }
        )
        mute = false;
        $('#mute').text("Mute");
    }
};
let toogleVideo = function (room) {
    if (showVideo) {

        room.localParticipant.videoTracks.forEach(function (track) {
                track.disable();
            }
        )
        showVideo = false;
        $('#show-video').text("Share Video");
    }
    else {
        room.localParticipant.videoTracks.forEach(function (track) {
                track.enable();
            }
        )
        showVideo = trackMode;
        $('#show-video').text("Turn off Video");
    }
};
let makeCall = function (data) {
    roomName = "biblestudy";

    log("Joining room '" + roomName + "'...");
    var connectOptions = {
        name: roomName,
        logLevel: 'debug'
    };

    if (previewTracks) {
        connectOptions.tracks = previewTracks;
    }

    // Join the Room with the token from the server and the
    // LocalParticipant's Tracks.
    Video.connect(data.token, connectOptions).then(roomJoined, function (error) {
        log('Could not connect to Twilio: ' + error.message);
    });
};

// Attach the Tracks to the DOM.
function attachTracks(tracks, container) {
  tracks.forEach(function(track) {
    container.appendChild(track.attach());
  });
}

// Attach the Participant's Tracks to the DOM.
function attachParticipantTracks(participant, container) {
  var tracks = Array.from(participant.tracks.values());
  attachTracks(tracks, container);
}

// Detach the Tracks from the DOM.
function detachTracks(tracks) {
  tracks.forEach(function(track) {
    track.detach().forEach(function(detachedElement) {
      detachedElement.remove();
    });
  });
}

// Detach the Participant's Tracks from the DOM.
function detachParticipantTracks(participant) {
  var tracks = Array.from(participant.tracks.values());
  detachTracks(tracks);
}

// When we are about to transition away from this page, disconnect
// from the room, if joined.
window.addEventListener('beforeunload', leaveRoomIfJoined);

// Obtain a token from the server in order to connect to the Room.

$.getJSON('/webrtc/token?name='+randomName(), function(data) {
  identity = data.identity;


  // Bind button to join Room.
  document.getElementById('button-join-audio').onclick = function() {
      makeCall(data);
      showVideo=false;
      $('#show-video').text("Share Video");


  };

    document.getElementById('button-join-video').onclick = function() {

        makeCall(data);
    };


    // Bind button to leave Room.
  document.getElementById('button-leave').onclick = function() {
    log('Leaving room...');
    activeRoom.disconnect();
  };


});

// Successfully connected!

function roomJoined(room) {
    window.room = activeRoom = room;


  log("Joined as '" + identity + "'");
    document.getElementById('button-join-audio').style.display = 'none';
    document.getElementById('button-join-video').style.display = 'none';
    document.getElementById('button-leave').style.display = 'inline';
    document.getElementById('show-video').style.display = 'inline';
    document.getElementById('mute').style.display = 'inline';

  // Attach LocalParticipant's Tracks, if not already attached.
  var previewContainer = document.getElementById('local-media');
  if (!previewContainer.querySelector('video')) {
    attachParticipantTracks(room.localParticipant, previewContainer);
  }
if(!showVideo){
    room.localParticipant.videoTracks.forEach(function (track) {
            track.disable();
        }
    )
    showVideo = false;
    $('#show-video').text("Share Video");
}


  // Attach the Tracks of the Room's Participants.
  room.participants.forEach(function(participant) {
    log("Already in Room: '" + participant.identity + "'");
    var previewContainer = document.getElementById('remote-media');
    attachParticipantTracks(participant, previewContainer);
  });

  // When a Participant joins the Room, log the event.
  room.on('participantConnected', function(participant) {
    log("Joining: '" + participant.identity + "'");
  });

  // When a Participant adds a Track, attach it to the DOM.
  room.on('trackAdded', function(track, participant) {
    log(participant.identity + " added track: " + track.kind);
    var previewContainer = document.getElementById('remote-media');
    attachTracks([track], previewContainer);
  });

  // When a Participant removes a Track, detach it from the DOM.
  room.on('trackRemoved', function(track, participant) {
    log(participant.identity + " removed track: " + track.kind);
    detachTracks([track]);
  });

  // When a Participant leaves the Room, detach its Tracks.
  room.on('participantDisconnected', function(participant) {
    log("Participant '" + participant.identity + "' left the room");
    detachParticipantTracks(participant);
  });

  // Once the LocalParticipant leaves the room, detach the Tracks
  // of all Participants, including that of the LocalParticipant.
  room.on('disconnected', function() {
    log('Left');
    if (previewTracks) {
      previewTracks.forEach(function(track) {
        track.stop();
      });
    }
    detachParticipantTracks(room.localParticipant);
    room.participants.forEach(detachParticipantTracks);
    activeRoom = null;
    document.getElementById('button-join-audio').style.display = 'inline';
    document.getElementById('button-join-video').style.display = 'inline';
    document.getElementById('button-leave').style.display = 'none';
  });
    // Bind button to mute.
    document.getElementById('mute').onclick = function() {
      toogleAudio(room);

    };
    document.getElementById('show-video').onclick = function() {
        toogleVideo(room);

    };
}

// Preview LocalParticipant's Tracks.
document.getElementById('button-preview').onclick = function() {
  var localTracksPromise = previewTracks
    ? Promise.resolve(previewTracks)
    : Video.createLocalTracks();

  localTracksPromise.then(function(tracks) {
    window.previewTracks = previewTracks = tracks;
    var previewContainer = document.getElementById('local-media');
    if (!previewContainer.querySelector('video')) {
      attachTracks(tracks, previewContainer);
    }
  }, function(error) {
    console.error('Unable to access local media', error);
    log('Unable to access Camera and Microphone');
  });
};

// Activity log.
function log(message) {

  // var logDiv = document.getElementById('log');
  // logDiv.innerHTML += '<p>&gt;&nbsp;' + message + '</p>';
  // logDiv.scrollTop = logDiv.scrollHeight;
}

// Leave Room.
function leaveRoomIfJoined() {
  if (activeRoom) {
    activeRoom.disconnect();
  }
}
