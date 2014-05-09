// Build image object from Flickr API
function ImageFetcher(){

  this.asyncGetImages = function(imageCount){
    asyncGetImageObjects(imageCount, asyncSetPositionFor);
  };

  function asyncGetImageObjects(imageCount, callback){
    var imagesList = [];
    var imagesUrl = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=8a0621b8d6dbf3abc50866449409121c&privacy_filter=1&has_geo=1&per_page="+imageCount+"&format=json&nojsoncallback=1";
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


// Build map and distance computation with Google map api
function GoogleMap() {

  var map;
  var marker;

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
    map.panTo(location);
  }

  this.removeMarker = function(){
    if(marker){
      marker.setMap(null);
    }
  }

  // this.asyncDistanceBetween = function(origin, destination){
  //   var service = new google.maps.DistanceMatrixService();
  //   service.getDistanceMatrix({
  //     origins: [origin],
  //     destinations: [destination],
  //     travelMode: google.maps.TravelMode.WALKING,
  //     durationInTraffic: false,
  //     avoidHighways: false,
  //     avoidTolls: false
  //   }, returnDistance);
  // };

  // function returnDistance(response, status) {
  //   if (status == google.maps.DistanceMatrixStatus.OK) {
  //     var results = response.rows[0].elements[0];
  //     var distance = results.distance.text;
  //     $.event.trigger({type: "distanceReturned", message: distance});
  //     console.log(distance);
  //   }
  // }
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
  var map = new GoogleMap();
  var controller = new DomManipulation();
  var gmap = google.maps.event;

  imageFetcher.asyncGetImages(5);

  gmap.addDomListener(window, 'load', function(){
    $(document).on("photosFetched", function(event) {
      var imagesList = event.message;
      var imagesCount = imagesCount;
      map.initialize();
      processGame(imagesList);
    });
  });

  function processGame(imagesList){
    var i = 0;
    var imagesList = imagesList;
    var imagesCount = imagesList.length;

    incentive();

    function incentive(){
      map.removeMarker();
      //controller.removeElement();
      controller.addElement(imagesList[i]);
      console.log('incentive');
      manageInput();
    }

    function manageInput(){
      console.log(imagesList[i].region);
      gmap.addListener(map.map(), 'click', function(event){
        console.log(event.latLng);
        map.placeMarker(event.latLng);
        map.asyncDistanceBetween(event.latLng, imagesList[i].position);
        gmap.clearInstanceListeners(map.map());
        nextTurn();
      });
    }

    function nextTurn(){
      $(document).on("distanceReturned", function(event) {
        var distance = event.message;
        var solution = 'This photo was shot in ' + imagesList[i].region + ', which is ' + distance + ' away from your marker';
        map.placeMarker(imagesList[i].position);
        console.log(distance + solution);
        $('#question').text(solution);

        $('#btn').on('click', function(){
          if (i = imagesCount - 1){
            console.log('finalScore()');
          }else{
            i ++;
            incentive();
          }
        });
      });
    }
  }
}




game();







