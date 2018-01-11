

function initMap() {
  var directionsDisplay = new google.maps.DirectionsRenderer;
  var directionsService = new google.maps.DirectionsService;
  var map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_CENTER
    },
    center: {lat: 12.929459, lng: 122.411300}
  })
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('right-panel'));

  var control = document.getElementById('floating-panel');
  control.style.display = 'block';
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);

  $.ajax('health_facilities.tsv', {
    success: function(data, status) {
      data = data.split("\n");
      var optgroups = [];
      for (var k in data) {
        var row = data[k].split("\t");
        if (row[0].length > 0) { // ignore empty first column
          if ((row.length == 1) || (row.length > 1 && row[1].length == 0)) {
            var optgroup = $('<optgroup label="'+row[0]+'">');
            optgroups.push(optgroup);
          } else if (row.length == 2) {
            var option = $('<option>').attr('value', row[0]).html(row[1]);
            optgroups[optgroup.length-1].append(option);
          }
        }
      }
      for (var k in optgroups) {
        $('.select2').append(optgroups[k]);
      }
      var onChangeHandler = function() {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
      };
      document.getElementById('start').addEventListener('change', onChangeHandler);
      document.getElementById('end').addEventListener('change', onChangeHandler);
      document.getElementById('clickfind').addEventListener('click', onChangeHandler);

      $(".select2").select2({ placeholder: "Select start", maximumSelectionSize: 1 });
    }
  })
  
}

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  var start = document.getElementById('start').value;
  var end = document.getElementById('end').value;
  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.DRIVING
  }, function(response, status) {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsDisplay.setDirections(response);
    } else {
      window.alert('Directions request failed due to ' + status + ' google support');
    }
  });
}