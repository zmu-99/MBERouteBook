/// <reference path="jsbridge.js" />
var btnclicked = false;
var liRecordId = null;
var missedStatus = "Missed";
var FS = FS || {};

FS.VIItemList = [];
FS.AllForemanGroups = [];
FS.CurrentUser = "";
FS.CurrentUserForemans = [];
FS.SelectedForemanGroups = "-1";
FS.SelectedToggle = 929530002; //Not Completed

FS.VIBoard = {
  onloadFunction: function() {
    document.getElementById("loader").style.display = "block";

    FS.SelectedToggle = 929530002;

    //Who is the current user?
    MobileCRM.Configuration.requestObject(
      function(config) {
        var settings = config.settings;
        // MobileCRM.bridge.alert(settings.userName + " " + settings.userLogin + " " + settings.systemUserId);
        FS.CurrentUser = settings.systemUserId;

        FS.VIBoard.getUserForemans();

        return false;
      },
      function(err) {
        /// <param name="err" type="String">/<param>
        document.getElementById("loader").style.display = "none";
        MobileCRM.bridge.alert("An error occurred: " + err);
      },
      null
    );
  },
  VehicleInspectionSetGlobalEvent: function() {
    MobileCRM.bridge.onGlobalEvent(
      "CompletedLeaseInspectionEvent",
      function(args) {
        FS.VIBoard.refreshDataOnly();
      },
      true
    );
  },
  refreshDataOnly: function() {
    //This retains the filters already selected an retrieves the data only again and rebuilds job table
            FS.VIBoard.onloadFunction();
  },
  getUserForemans: function() {
    var fetchData = {
      userid: FS.CurrentUser
    };
    var fetchXml = [
      "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' distinct='true'>",
      "  <entity name='bookableresourcecategoryassn'>",
      "    <link-entity name='bookableresource' from='bookableresourceid' to='resource' alias='br'>",
      "      <attribute name='name' />",
      "      <filter>",
      "        <condition attribute='userid' operator='eq' value='",
      fetchData.userid,
      "'/>",
      "      </filter>",
      "    </link-entity>",
      "    <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory' alias='brc'>",
      "      <attribute name='name' />",
      "      <attribute name='iroc_foremangroup' />",
      "    </link-entity>",
      "  </entity>",
      "</fetch>"
    ].join("");
    FS.CurrentUserForemans = [];
    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function(userForemans) {
        for (var i in userForemans) {
          var currentRecord = userForemans[i].properties;
          FS.CurrentUserForemans.push(currentRecord["brc.iroc_foremangroup"]);
        }

        //Now that we have the users Foremans, we can retrieve all Foremans.
        FS.VIBoard.getForeman();
      },
      function(error) {
        document.getElementById("loader").style.display = "none";
        MobileCRM.bridge.alert("Get Foreman Error: " + error);
      },
      null
    );
  },
  buildTable: function(itemArray) {
    var table = document.getElementById("litablelist");
    table.tBodies[0].innerHTML = "";
    var months = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC"
    ];
    var monthsMixed = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ];
    var viRows = "";
    for (var i in itemArray) {
      var currentRecord = itemArray[i];
      var linemessage = "<br/>";
      if (FS.SelectedToggle.toString() == "929530000") {
        //Completed
        var completedOn =
          monthsMixed[currentRecord.CompletedOn.getMonth()] +
          " " +
          currentRecord.CompletedOn.getDate();
        linemessage = currentRecord.CompletedBy + " on " + completedOn;
      }

      viRows =
        viRows +
        //"<tr class='irocTitle' id='" + currentRecord.LIID + "' onclick='FS.VIBoard.onClickOpen(this)'>" +
        //"<td class='irocTitle'>" + linemessage + "</td></tr>";

        //Row 1, 2 columns
        "<tr onclick='FS.VIBoard.onClickOpen(this)' id='" +
        currentRecord.VIID +
        "'>" +
        //"<td rowspan='2' class='irocMonth'>" +
        //months[currentRecord.CreatedOn.getMonth()] +
        //"</td>" +
        "<td class='irocLI_Title'>" +
        currentRecord.VIName +
        "<br/></td>" +
        "</tr>" +
        //Row 2
        "<tr onclick='FS.VIBoard.onClickOpen(this)' id='" +
        currentRecord.VIID +
        "'>" +
        "<td class='irocBody irocLITableLastRow'>" +
        linemessage +
        "</td>" +
        "</tr>";
    }
    table.tBodies[0].innerHTML += viRows;
    document.getElementById("loader").style.display = "none";
    if (itemArray.length == 0) {
      $("#noRecords").show();
    } else {
      $("#noRecords").hide();
    }
      if (FS.SelectedToggle.toString() == "929530000") {
          var numberRecords = itemArray.length.toString() + " Completed Inspections";
          $(".counter").html(numberRecords);
      } else {
          var numberRecords = itemArray.length.toString() + " Remaining Inspections";
          $(".counter").html(numberRecords);
      }
  },

  getForeman: function() {
    var fetchForemanXML =
      "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' disctinct='true'>" +
      "<entity name = 'bookableresourcecategory'>" +
      "<attribute name='iroc_foremangroup' />" +
      "<attribute name='name' />" +
      "    <filter>" +
      "      <condition attribute='statecode' operator='eq' value='0'/>" +
      "    </filter>" +
      "</entity >" +
      "</fetch>";

    FS.AllForemanGroups = [];
    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchForemanXML,
      function(defaultForeman) {
        var selected = false;
        for (var i in defaultForeman) {
          var foremanrecords = defaultForeman[i].properties;
          var newItem = new Object();
          newItem.ForemanID = foremanrecords["iroc_foremangroup"];
          newItem.ForemanName = foremanrecords["name"];
          FS.AllForemanGroups.push(newItem);
        }

        var foremanListGroup = document.getElementById("foremangroupfilter");
        foremanListGroup.options[0] = new Option("Select All", -1);
        var optNumber = 0;
        for (var t in FS.AllForemanGroups) {
          // console.log("set foreman options");
          var currentRecord = FS.AllForemanGroups[t];
          var name = currentRecord.ForemanName;
          var picklistValue = currentRecord.ForemanID;
          //Select users by default.  They may have more than one foremangroup (night operators)
          optNumber++;
          //  MobileCRM.bridge.alert("add to option " + optNumber.toString() + " " + name + " value " + picklistValue + " selected? " + selected);
          foremanListGroup.options[optNumber] = new Option(name, picklistValue);

          if (FS.CurrentUserForemans.length > 0 && !selected) {
            for (var s = 0; s < FS.CurrentUserForemans.length; s++) {
              //MobileCRM.bridge.alert("Foreman CurrentUserForemans: " + name + " " + " " + picklistValue + " " + FS.CurrentUserForemans[s]);
              if (
                FS.CurrentUserForemans[s].toString() == picklistValue.toString()
              ) {
                selected = true;
                foremanListGroup.options[optNumber].selected = true;
                FS.SelectedForemanGroups = picklistValue;
              }
            }
          }
        }
        //Now that we have the Foreman groups, we get all VIs
        FS.VIBoard.getAllVIs();
      },
      function(error) {
        document.getElementById("loader").style.display = "none";
        MobileCRM.bridge.alert("Get Foreman Error: " + error);
      },
      null
    );
  },

  //Bryan - this is the onclick that opens the form
  onClickOpen: function(e) {
    //  MobileCRM.bridge.alert("onClickOpen " + e.id);
    var dataitem = e.id;
    MobileCRM.UI.FormManager.showDetailDialog(
      "iroc_leaseinspection",
      dataitem,
      null
    );
  },
  setClick: function() {
    $("#lbl").click(function(event) {
      //  MobileCRM.bridge.alert("click ");
      if ($("#toggleCheck").prop("checked")) {
        //alert("Was Checked1");
        $("#lbl").html("Not Complete");
        FS.VIBoard.toggleFilterButtonNotCompleted();
      } else {
        //alert("Was Not Checked2");
        $("#lbl").html("Complete");
        FS.VIBoard.toggleFilterButtonComplete();
      }
    });
  },
  toggleFilterButtonNotCompleted: function() {
    // MobileCRM.bridge.alert("toggleFilterButtonNotCompleted ");

    FS.SelectedToggle = 929530002; //Not Completed
    FS.VIBoard.applyFilters();
  },
  toggleFilterButtonComplete: function() {
    //  MobileCRM.bridge.alert("toggleFilterButtonComplete ");

    FS.SelectedToggle = 929530000; // Completed
    FS.VIBoard.applyFilters();
  },
  getAllVIs: function() {
    //Current Vehicle Inspections for the month
    var fetchData = {
      iroc_vehicleinspectionstatus: "929530001",  /*Completed-Repair*/
      iroc_vehicleinspectionstatus2: "929530000", /*Completed-OK*/
      iroc_vehicleinspectionstatus3: "929530002"  /*Not Completed*/,
    };
    var fetchLIXml = [
      "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false'>",
        "<entity name = 'iroc_vehicleinspection' > ",
        "<attribute name='createdon'/>",
        "<attribute name='iroc_vehicleinspectionstatus'/>",
        "<attribute name='iroc_completedinspectiondate'/>",
        "<attribute name='iroc_completedby'/>",
        "<attribute name='iroc_vehicleinspectionid'/>",
        "<attribute name='iroc_name'/>",
        "<attribute name='iroc_vehicleid'/>",
        "<attribute name='iroc_vehicleinspectionstatusname'/>",
        "<attribute name='iroc_completedbyname'/>",
        "<attribute name='iroc_vehicleidname'/>",
        -"<filter type='or' > ",
            "<condition attribute='iroc_vehicleinspectionstatus' operator = 'eq' value='",
        fetchData.iroc_vehicleinspectionstatus2 /*929530001*/,
        "'/>",
        "<condition attribute='iroc_vehicleinspectionstatus' operator = 'eq' value='",
            fetchData.iroc_vehicleinspectionstatus /*929530000*/,
            "'/>",
        "<condition attribute='iroc_vehicleinspectionstatus' operator = 'eq' value='",
            fetchData.iroc_vehicleinspectionstatus3 /*929530002*/,
            "'/>",
        "</filter>",
        -"<link-entity name='iroc_vehicle' to = 'iroc_vehicleid' from='iroc_vehicleid'>",
        "<attribute name='iroc_responsiblecell1'/>",
        "<attribute name='iroc_vehiclenumber'/>",
        "<attribute name='iroc_responsible1idname'/>",
        "<attribute name='iroc_responsible2idyominame'/>",
        "<attribute name='iroc_responsiblecell2'/>",
        "<attribute name='iroc_foremangroup'/>",
        "<attribute name='iroc_responsible1idyominame'/>",
        "<attribute name='iroc_leader'/>",
        "<attribute name='iroc_responsible1id'/>",
        "<attribute name='iroc_name'/>",
        "<attribute name='iroc_responsible2idname'/>",
        "<attribute name='iroc_vehicleid'/>",
        "<attribute name='iroc_responsible2id'/>",
      "    </link-entity>",
      "  </entity>",
      "</fetch>"
    ].join("");
    FS.VIItemList = [];
    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchLIXml,
      function(defaultvirecords) {
        //MobileCRM.bridge.alert("defaultvirecords " + defaultvirecords.length);
        for (var i in defaultvirecords) {
          var virecords = defaultvirecords[i].properties;
          //Create Array List of Objects
          var newItem = new Object();
          newItem.VIID = virecords["iroc_vehicleinspectionid"];
          newItem.VIName = virecords["iroc_name"].primaryName;
          newItem.VIStatusName = virecords["iroc_vehicleinspectionstatusname"];
          newItem.VIStatus = virecords["iroc_vehicleinspectionstatus"];
          newItem.ForemanGroupPicklistValue =
            virecords["pad.iroc_foremangroup"] == undefined
              ? null
              : virecords["pad.iroc_foremangroup"];
          newItem.CreatedOn = virecords["createdon"];
          newItem.CompletedOn = virecords["iroc_completedinspectiondate"];
          newItem.CompletedBy =
            virecords["iroc_completedby"] === undefined
              ? "unknown"
              : virecords["iroc_completedby"].primaryName;
          FS.VIItemList.push(newItem);
        }
        FS.VIItemList.sort(FS.VIBoard.SortByLIName);
        FS.VIBoard.applyFilters();
      },
      function(error) {
        document.getElementById("loader").style.display = "none";
        MobileCRM.bridge.alert("Get VIs Error: " + error);
      },
      null
    );
  },
  SortByVIName: function(a, b) {
    var aName = a.VIName.toLowerCase();
    var bName = b.VIName.toLowerCase();
    return aName < bName ? -1 : aName > bName ? 1 : 0;
  },
  applyFilters: function() {
    debugger;
    var tempVIArray = FS.VIItemList;

    //Filter to Completed/Not Complete Toggle
    var tempCompletedVI = tempVIArray;
    var NotComplete = true;

    tempCompletedVI = $.grep(
      tempVIArray,
      function(n, i) {
        return n.VIStatus == FS.SelectedToggle;
      },
      false
    );

    //Filter the LI Array to just the selected foreman groups
    var tempForemanArray = tempCompletedVI;
    debugger;
    if (FS.SelectedForemanGroups.toString() != "-1") {
      tempForemanArray = jQuery.grep(tempCompletedVI, function(n, i) {
        if (
          n.ForemanGroupPicklistValue != null &&
          n.ForemanGroupPicklistValue.toString() ===
            FS.SelectedForemanGroups.toString()
        ) {
          return true;
        }
        return false;
      });
    }
    FS.VIBoard.buildTable(tempForemanArray);
  },

  onchange: function() {
    var e = document.getElementById("foremangroupfilter");
    var value = e.options[e.selectedIndex].value;
    //var text = e.options[e.selectedIndex].text;
    // MobileCRM.bridge.alert("Onchnage " + value.toString());

    FS.SelectedForemanGroups = value.toString();
    //console.log("option is " + value + " label is " + text);

    FS.VIBoard.applyFilters();
  }
};
