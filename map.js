// Build image object from Flickr API
function ImageFetcher(){

  this.asyncGetImages = function(imageCount){
    asyncGetImageObjects(imageCount, asyncSetPositionFor);
  };

  function asyncGetImageObjects(imageCount, callback){
    var imagesList = [];
    var imagesUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8a0621b8d6dbf3abc50866449409121c&privacy_filter=1&accuracy=11&has_geo=1&per_page="+ imageCount +"&format=json&nojsoncallback=1";

    $.getJSON(imagesUrl, function(imageObject){
      for(var i = 0; i<imageCount; i++){
        var image = imageObject.photos.photo[i]
        imagesList.push(image);
        setUrlFor(image);
        buildDomElementFor(image, imagesList);
        callback(image, imagesList, imageCount);
      }
    });
  }

  function setUrlFor(image){
    image.url = "http://farm" + image.farm + ".staticflickr.com/" + image.server + "/" + image.id + "_" + image.secret + ".jpg";
  }

  function buildDomElementFor(image, imagesList){
    var $element = $("<img>", { class: "image", id: "image" + (imagesList.indexOf(image)+1), src: image.url});
    image.element = $element;
  }

  function asyncSetPositionFor(image, imagesList, imageCount){
    var imagesList = imagesList;
    var positionUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation&api_key=8a0621b8d6dbf3abc50866449409121c&photo_id=" + image.id + "&format=json&nojsoncallback=1";

    $.get(positionUrl, function(positionObject){
      var position = positionObject.photo.location;
      image.position = new google.maps.LatLng(position.latitude,position.longitude);
      image.region = position.region._content + ", " + position.country._content;
      if (imagesList.indexOf(image) == imageCount-1){
        $.event.trigger({type: "photosFetched", message: imagesList});
      }
    });
  }
}



// Build map and distance computation
function Map() {

  var map;
  var markersList = [];

  this.initialize = function(){
    var myLatlng = new google.maps.LatLng(48.8567, 2.3508)
    var mapOptions = {
      center: myLatlng,
      zoom: 5
    }
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  };

  this.map = function(){
    return map;
  }

  this.placeMarker = function(location){
    var marker = new google.maps.Marker({
      position: location,
      map: map
    });
    markersList.push(marker);
    map.panTo(location);
  }

  this.removeMarker = function(){
    if(markersList != []){
      markersList.forEach(function(marker) {
        marker.setMap(null);
      });
    }
  }

  this.getDistanceBetween = function(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = degToRad(lat2-lat1);  // degToRad below
    var dLon = degToRad(lon2-lon1);

    var a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // Distance in km

    return Math.floor(d);
  }

  function degToRad(deg) {
    return deg * (Math.PI/180)
  }
}



function DomManipulation(){

  this.addElement = function(object){
    var id = object.element[0].id;
    $('#add-image').append(object.element);
    $('#' + id).fadeIn("slow");
  };

  this.removeElement = function(object){
    if (object){
      var id = object.element[0].id;
      $('#' + id).fadeOut("slow").remove();
    }
  };
}



var game = function(){

  var imageFetcher = new ImageFetcher();
  var map = new Map();
  var controller = new DomManipulation();
  var gmap = google.maps.event;

  $('#btn').text('next');

  imageFetcher.asyncGetImages(5);

  gmap.addDomListener(window, 'load', function(){
    $(document).on("photosFetched", function(event) {
      var imagesList = event.message;
      map.initialize();
      processGame(imagesList);
    });
  });

  function processGame(imagesList){
    var i = 0;
    var imagesList = imagesList;
    var imagesCount = imagesList.length;
    var imageLat = imagesList[i].position.k;
    var imageLng = imagesList[i].position.A;
    var distance;
    var score = 0;

    incentive();

    function incentive(){
      map.removeMarker();
      if(i != 0){controller.removeElement(imagesList[i - 1])};
      controller.addElement(imagesList[i]);
      manageInput();
    }

    function manageInput(){
      gmap.addListener(map.map(), 'click', function(event){
        map.placeMarker(event.latLng);
        distance = map.getDistanceBetween(event.latLng.k, event.latLng.A, imageLat, imageLng);
        score += distance;
        gmap.clearInstanceListeners(map.map());
        nextTurn();
      });
    }

    function nextTurn(){
      var solution = 'This photo was shot in ' + imagesList[i].region + ', which is ' + distance + 'km away from your marker';
      var finalScore = 'Your final score is '+ score +'km .'

      map.placeMarker(imagesList[i].position);
      $('#question').text(solution);
      $('#btn').on('click', function(){
        $('#btn').off('click');
        if (i == imagesCount - 1){
          controller.removeElement(imagesList[i]);
          $('#question').text(finalScore);
          $('#btn').text('retry');
          $('#btn').on('click', function(){
            $('#btn').off('click');
            game();
          });
        }else{
          i ++;
          incentive();
        }
      });
    }
  }
}

game();







