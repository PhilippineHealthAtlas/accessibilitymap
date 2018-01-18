var map;
var currData = [];
var COL_LATLNG = 0, COL_NAME = 1, COL_TYPE = 4;
var region = location.href.match(/region=/) ? '_region_' + location.href.replace(/.+region=/g,'') : '';

function initMap() {
  var directionsDisplay = new google.maps.DirectionsRenderer();
  var directionsService = new google.maps.DirectionsService();
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 6,
    mapTypeControlOptions: {
      position: google.maps.ControlPosition.BOTTOM_CENTER
    },
    center: {lat: 12.929459, lng: 122.411300}
  })
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById('directions-panel'));

  var control = document.getElementById('floating-panel');
  control.style.display = 'block';
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(control);
  map.markers = [];
  $.ajax('health_facilities'+region+'.tsv', {
    success: function (data, status) {
      reloadData(data, status);
      currData = data;
      var onChangeHandler = function() {
        calculateAndDisplayRoute(directionsService, directionsDisplay);
      };
      document.getElementById('start').addEventListener('change', onChangeHandler);
      document.getElementById('end').addEventListener('change', onChangeHandler);
      document.getElementById('clickfind').addEventListener('click', onChangeHandler);
      
      var onFacilityTypeChange = function(obj) {
        console.log(obj);
        console.log("facility type change");
        reloadData(currData, obj.value);
      }
      $('#start_facility_type').on('change', onFacilityTypeChange);
      //document.getElementById('end_facility_type').addEventListener('change', onFacilityTypeChange);
    }
  })
  
}

    
    
    function reloadData(data, status) {
      console.log(status);
      if (status != 'success') {
        $('select .select2').select2('destroy').html('');
      }
      data = data.split("\n");
      currData = data;
      var optgroups = [];
      var facility_types = [], curr_facility_type = '';
      var bounds = new google.maps.LatLngBounds();
      for (var k in data) {
        var row = data[k].split("\t");
        if (row[COL_LATLNG].length > 0) { // ignore empty first column
          if ((row.length == 1) || (row.length > 1 && row[COL_NAME].length == 0)) {
            var optgroup = $('<optgroup label="'+row[COL_LATLNG]+'" id="'+stubify(row[COL_LATLNG])+'">');
            optgroups.push(optgroup);
            facility_types.push(row[COL_LATLNG]);
            curr_facility_type = row[COL_LATLNG];
          } else if (row.length > 1 && row[COL_NAME].length > 0 && (status == 'success' || status == curr_facility_type)) {
            var option = $('<option>').attr('value', row[COL_LATLNG].replace(/"/g,'')).html(row[COL_NAME]).data('type', row[COL_TYPE]);
            optgroups[optgroup.length-1].append(option);
            var locs = row[COL_LATLNG].replace(/[^0-9\.,]/g,'').split(',');
            var position = new google.maps.LatLng(parseFloat(locs[0]),parseFloat(locs[1]));
            bounds.extend(position);
            var marker = new google.maps.Marker({
              map: map,
              position: position,
              title: row[COL_NAME],
              icon: 'icons/' + stubify(row[COL_TYPE]) + '.png'
            });
            marker.facility_type = row[COL_TYPE];
            map.markers.push(marker);
          }
        }
      }
      map.fitBounds(bounds);
      map.setZoom(map.getZoom()+1);
      for (var k in optgroups) {
        $('.select2').append(optgroups[k]);
      }
      for (var k in facility_types) {
        var facility_type = facility_types[k];
        $('.select-facility-type').append($('<option>').attr('value', facility_type).html(facility_type));
        $('#legend').append($('<div>').html('<input onclick="updateMap()" type="checkbox" value="'+facility_type+'" checked><img src="icons/'+stubify(facility_type)+'.png"> ' + facility_type));
      }
      $(".select2").select2({ placeholder: "Select facility", maximumSelectionSize: 1 });
      $(".select-facility-type").select2({ placeholder: "", maximumSelectionSize: 1 });
    }

function updateMap() {
  var legends = $('#legend input'), mapping = {};
  for (var i in legends) {
    mapping[legends[i].value] = legends[i].checked;
  }
  for (var i in map.markers) {
    var facility_type = map.markers[i].facility_type;
    if (!mapping[facility_type])
      map.markers[i].setMap(null);
    else 
      map.markers[i].setMap(map);
  }
  console.log(mapping);
}    

function stubify(text) { return text.toLowerCase().trim().replace(/ /g,'_').replace(/[^0-9a-z_]/g); }

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