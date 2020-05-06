/// <reference path="jsbridge.js" />
var btnclicked = false;
var brbRecordId = null;
var missedStatus = "Missed";
var countNonScheduled = 0;
var FS = FS || {};

FS.BRBItemList = [];
FS.AllForemanGroups = []; //This hold the optionset name and value (BRCId) for all foremans
FS.AllResources = [];
FS.AllResourcesUniqueBR = [];
FS.AllResourcesUniqueForemans = [];
FS.AllRouteOperators = [];
FS.AllQueues = []; //This holds the foremangroup Queue (BRCId)
FS.MissedReasonLabels = [];
FS.CurrentUser = "";
FS.CurrentUserBRId = null;
FS.SelectedForemanGroups = [];
FS.SelectedResources = [];
FS.SelectedJobTypes = [];
FS.SelectedDate = new Date();
FS.SelectedDatePlus1 = new Date();
FS.SelectedToggle = "Scheduled";
FS.SelectedToggle2 = "";
FS.ForemanQueues = []; //This holds the foremangroup Queue (BRCId)
FS.thisUserForemans = [];
FS.thisUserForemanQueues = [];
FS.FirstTimeLoad = true;
FS.thisUserRoutes = [];
FS.thisUserForemanPicklist = [];
FS.RetrievedDates = [];

FS.RouteBoard = {
  onRefresh: function () {
    //Clear all the options
    //$("#reasonerror").hide();
    $("#foremangroupfilter").empty().multiselect("refresh");
    $("#resourcefilter").empty().multiselect("refresh");
    $("#jobfilter").empty().multiselect("refresh");

    $("#foremangroupfilter").multiselect("destroy");
    $("#resourcefilter").multiselect("destroy");
    $("#jobfilter").multiselect("destroy");
    $("#logoLoader").show();
    $("#toggleSwitch").show();
    $("#card").show();
    $("#reasons").hide();
    //Set to first time
    FS.FirstTimeLoad = true;

    //Clear array
    FS.RetrievedDates = [];
    FS.BRBItemList = [];
    FS.AllForemanGroups = [];
    FS.AllResources = [];
    FS.AllResourcesUniqueBR = [];
    FS.AllResourcesUniqueForemans = [];
    FS.AllRouteOperators = [];
    FS.MissedReasonLabels = [];
    FS.CurrentUser = "";
    FS.SelectedForemanGroups = [];
    FS.SelectedResources = [];
    FS.SelectedJobTypes = [];
    FS.SelectedDate = new Date();
    FS.SelectedToggle = "Scheduled";
    FS.SelectedToggle2 = "";
    FS.thisUserForemans = [];
    FS.thisUserForemanQueues = [];
    FS.thisUserForemanPicklist = [];
    FS.thisUserRoutes = [];
    FS.ForemanQueues = []; //This holds the foremangroup Queue (BRCId)

    //re-run onLoad
    FS.RouteBoard.onloadFunction();
  },
  onloadFunction: function () {
    //Enables the create new button and hides the modal initially
    FS.RouteBoard.createNewToggle();
    //Since the assign and missed html is all in one page on load we are hiding and showing only the cards and menu
    FS.RouteBoard.displayRule();
    //loads list of reason into the missed reasons list
    FS.RouteBoard.loadReasons();

    //enables the booking status filter
    FS.RouteBoard.bookingStatusFilter();
    //enables sliding menu in brb cards
    FS.RouteBoard.slidingCardEvent();
    //enables toggling of filter menu
    FS.RouteBoard.toggleMenu();
    //enables events between routefeed and routboard
    FS.RouteBoard.RouteFeedSetGlobalEvent();

    //Set the datepicker to today
    $("#datefilter").val(FS.RouteBoard.getFormattedDate(FS.RouteBoard.today()));
    FS.SelectedDate = FS.RouteBoard.today();
    FS.SelectedDatePlus1.setDate(FS.SelectedDate.getDate() + 1);

    //Who is the current user?
    MobileCRM.Configuration.requestObject(
      function (config) {
        FS.FirstTimeLoad = true;
        var settings = config.settings;
        // MobileCRM.bridge.alert(settings.userName + " " + settings.userLogin + " " + settings.systemUserId);
        FS.CurrentUser = settings.systemUserId;
        //FS.RouteBoard.getSafetyNotifications();
        FS.RouteBoard.loadJobTypes();

        var newFetch = FS.RouteBoard.buildFetch();
        var newFetch1 = FS.RouteBoard.buildFetchCompleted();
        FS.RouteBoard.getAllBRBs(newFetch, newFetch1);
        FS.RetrievedDates.push(FS.SelectedDate.toLocaleDateString());
        //enables the toggling of user notification on/off
        FS.RouteBoard.toggleUserNotification(FS.CurrentUser);
        return false;
      },
      function (err) {
        /// <param name="err" type="String">/<param>
        MobileCRM.bridge.alert("An error occurred: " + err);
      },
      null
    );
  },
  slidingCardEvent: function () {
    var card = document.getElementById("card");
    $(".chevronUp").hide();
    $(".filter-open").hide();

    card.addEventListener("touchstart", handleTouchStart, false);
    card.addEventListener("touchmove", handleTouchMove, false);

    var xDown = null;
    var yDown = null;

    function getTouches(evt) {
      return (
        evt.touches || evt.originalEvent.touches // browser API
      ); // jQuery
    }

    function handleTouchStart(evt) {
      const firstTouch = getTouches(evt)[0];
      xDown = firstTouch.clientX;
      yDown = firstTouch.clientY;
    }

    function handleTouchMove(evt) {
      let span = evt.target.closest("span");

      if (!xDown || !yDown) {
        return;
      }

      var xUp = evt.touches[0].clientX;
      var yUp = evt.touches[0].clientY;

      var xDiff = xDown - xUp;
      var yDiff = yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        /*most significant*/
        if (xDiff > 0) {
          $("#" + span.id + "> #swiper ").removeClass("side-menu-swiped-left");
          $("#" + span.id + "> #content ").removeClass("display-none");
        } else {
          $("#" + span.id + " > #content ").addClass("display-none");
          $("#" + span.id + " > #swiper ").addClass("side-menu-swiped-left");
        }
      } else {
        if (yDiff > 0) {
          //swiped up
        } else {
          //swiped down
        }
      }
      /* reset values */
      xDown = null;
      yDown = null;
    }
  },
  toggleMenu: function () {
    let filterEvent = document.getElementById("filterEvent");
    filterEvent.addEventListener("click", toggle);
    function toggle() {
      var text = $("#filterText").text();
      if (text === "Filter") {
        text = $("#filterText").text("CURRENT VIEW");
        $(".chevronDown").hide();
        $(".chevronUp").show();
        $(".filter-open").show();
      } else {
        text = $("#filterText").text("Filter");
        $(".chevronDown").show();
        $(".chevronUp").hide();
        $(".filter-open").hide();
      }
    }
  },
  toggleUserNotification: function (userId) {
    //initial show/hide of notification icon
    MobileCRM.DynamicEntity.loadById(
      "systemuser",
      userId,
      function (entity) {
        if (entity.properties.iroc_isholdnotifications === false) {
          $("#notificationOff").hide();
          $("#notificationOn").show();
        } else {
          $("#notificationOff").show();
          $("#notificationOn").hide();
        }
      },
      function (error) {
        MobileCRM.bridge.alert("An error occurred: " + error);
      },
      null
    );

    //Grabbing event area and setting event listener
    let notificationEvent = document.getElementById("notificationEvent");
    notificationEvent.addEventListener("click", toggle);

    //togglet event
    function toggle() {
      MobileCRM.DynamicEntity.loadById(
        "systemuser",
        userId,
        function (entity) {
          if (entity.properties.iroc_isholdnotifications === false) {
            $("#notificationOff").show();
            $("#notificationOn").hide();
            entity.properties["iroc_isholdnotifications"] = true;
            entity.save(FS.RouteBoard.callBack);
          } else {
            $("#notificationOff").hide();
            $("#notificationOn").show();
            entity.properties["iroc_isholdnotifications"] = false;
            entity.save(FS.RouteBoard.callBack);
          }
        },
        function (error) {
          MobileCRM.bridge.alert("An error occurred: " + error);
        },
        null
      );
    }
  },
  RouteFeedSetGlobalEvent: function () {
    MobileCRM.bridge.onGlobalEvent(
      "CompletedRouteFeedEvent",
      function (args) {
        FS.RouteBoard.refreshDataOnly();
        
      },
      true
    );
  },
  openUserGuide: function () {
    MobileCRM.UI.IFrameForm.requestObject(
      function (iFrame) {
        MobileCRM.UI.IFrameForm.show(
          "User Guide",
          "file://MBEUserGuideHelp/EquinorHelp.html",
          false
        );
      },
      MobileCRM.bridge.alert,
      null
    );
  },
  refreshDataOnly: function () {
    $("#logoLoader").show();
    //This retains the filters already selected an retrieves the data only again and rebuilds job table

    FS.RetrievedDates = [];

    FS.BRBItemList = [];

    FS.FirstTimeLoad = false;

    var newFetch = FS.RouteBoard.buildFetch();

    var newFetch1 = FS.RouteBoard.buildFetchCompleted();

    FS.RouteBoard.getAllBRBs(newFetch, newFetch1);

    FS.RetrievedDates.push(FS.SelectedDate.toLocaleDateString());

    $("#toggleSwitch").show();
    $("#card").show();
    $("#logoLoader").hide();
  },
  displayRule: function () {
    $("#card").show();
    $("#toggleSwitch").show();

    $("#assign").hide();
    $("#reasons").hide();
  },
  buildTable: function (itemArray) {
    //Set the record counter

    var numberRecords = itemArray.length.toString();
    $("#counter").text(numberRecords);

    var brbCards = document.getElementById("card");
    brbCards.innerHTML = "";
    var brbRows = "";
    for (var i in itemArray) {
      var currentRecord = itemArray[i];
      var start = currentRecord.StartTime;
      var startdate = "";
      if (start !== null) {
        var adjustHours =
          start.getHours() > 12 ? start.getHours() - 12 : start.getHours();
        startdate = [
          [adjustHours, FS.RouteBoard.addZero(start.getMinutes())].join(":"),
        ];
        var addon = "AM";
        addon = start.getHours() >= 12 ? "PM" : "AM";
        startdate = startdate + addon;
      }
      var showHideIcons = "visible";
      var showHideMissedIcon = "visible";
      var showLateIcon = "none";
      if (currentRecord.Late) {
        showLateIcon = "block";
      }
      var displayName = currentRecord.BRBName;
      //If the booking is complete we do not show the icons except for Lease Inspection if required.
      if (currentRecord.Completed) {
        displayName = displayName + " - " + currentRecord.BookingStatusName;
        showHideIcons = "hidden";
        showHideMissedIcon = "hidden";
        //if the booking is Missed but reason missed is not filled in, we show the missed reason icon so they can update
        if (currentRecord.MissedStatus) {
          if (
            currentRecord.MissedReason == "" ||
            currentRecord.MissedReason.toString() == "-1"
          ) {
            showHideMissedIcon = "visible";
          } else {
            //What is the label?
            var displayLabel = [];
            debugger;
            displayLabel = $.grep(FS.MissedReasonLabels, function (n, i) {
              // MobileCRM.bridge.alert("n.PklValue=" + n.PklValue.toString() + " FS.M=" + currentRecord.MissedReason.toString());
              if (
                n.PklValue.toString() == currentRecord.MissedReason.toString()
              ) {
                return true;
              }
              return false;
            });
            if (displayLabel.length > 0) {
              displayName = displayName + " (" + displayLabel[0].Label + ")";
            } else {
              displayName = displayName + " (-- UNKNOWN --)";
              showHideMissedIcon = "visible";
            }
          }
        }
      }

      switch (currentRecord.JobType) {
        case 929530002: //Alarm
          currentRecord.JobTypeText = "Alarm Response";
          break;
        case 929530001: //Maintenance
          currentRecord.JobTypeText = "Maintenace Request";
          break;
        case 929530003: //Workover visit
          currentRecord.JobTypeText = "Workover Support";
          break;
        case 929530004: //SWD visit
          currentRecord.JobTypeText = "SWD Visit";
          break;
        case 929530000: //Schedule visit
          currentRecord.JobTypeText = "Scheduled Visit";
          break;
        case 929530005: //Office
          currentRecord.JobTypeText = "Office/Admin";
      }

      brbRows =
        brbRows +
        `<span id=${currentRecord.PadId} class="card">
          <div class="job-type-color" style="background-color:${
            currentRecord.Color
          }"></div>
            <div id="content" class="card-grid"  style=${
              currentRecord.Completed ? `background-color:#3A55492E;` : ``
            }>

                <div id=${
                  currentRecord.PadId
                } onclick="FS.RouteBoard.onbrbRowClick(this)" class="actual-card">
                    <div>
                        <p class="visit-type">${currentRecord.JobTypeText}</p>
                        <p class="assigned-text">${
                          currentRecord.ResourceName
                        }</p>
                        <h1>${currentRecord.PadName}</h1>
                    </div>

                </div>

                <div class="time-icon-tray">
                    <p>${startdate}</p>
                   ${
                     currentRecord.MissedStatus
                       ? `<img src="./Media/alert-circle.svg" />`
                       : ``
                   } 
                    ${
                      currentRecord.LeaseRequired
                        ? `<img src="./Media/clipboard.svg"/>`
                        : ``
                    }
                </div>
            </div>

             <div id="swiper" class="side-menu">
                <div  id=${
                  currentRecord.BRBId
                } onclick="FS.RouteBoard.onCreateRouteFeedClick(this)">
                    <img src="./Media/checkmark-circle-outline.svg" />
                    <p>Close</p>
                </div>

                <div id=${
                  currentRecord.BRBId
                } onclick="FS.RouteBoard.onAssignBtnClick(this)">
                    <img src="./Media/arrow-forward-outline.svg" />
                    <p>Reassign</p>
                </div>
                <div id=${
                  currentRecord.BRBId
                } onclick="FS.RouteBoard.onReasonBtnClick(this)">
                    <img src="./Media/alarm-outline.svg" />
                    <p>Missed</p>
                </div>
               ${
                 currentRecord.LeaseRequired
                   ? `<div id=${currentRecord.LeaseLink} onclick="FS.RouteBoard.onLeaseClick(this)">
                    <img src="./Media/clipboard-outline.svg" />
                    <p>Lease Inspection</p>
                </div>`
                   : ``
               } 
            </div>
        </span>`;
    }
    brbRows = brbRows + `<span class="card-space"> </span>`; //This is a place holder card. Without this the last card sliding event experiences a cutoff if below phone screen
    brbCards.innerHTML += brbRows;
    $("#logoLoader").hide();

    // if (itemArray.length == 0) {
    //   $("#noRecords").show();
    // } else {
    //   $("#noRecords").hide();
    // }
  },
  buildFetchCompleted: function () {
    var date1 = FS.SelectedDate.toLocaleDateString();
    var date2 = FS.SelectedDatePlus1.toLocaleDateString();
    //Completed last 3 days
    // MobileCRM.bridge.alert("buildFetchCompleted-" + date1);
    var fetchXmlComplete =
      "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false'>" +
      "  <entity name='bookableresourcebooking'>" +
      "    <attribute name='bookingstatus' />" +
      "    <attribute name='bookableresourcebookingid' />" +
      "    <attribute name='name' />" +
      "    <attribute name='starttime' />" +
      "    <attribute name='msdyn_workorder' />" +
      "    <attribute name='resource' />" +
      "    <attribute name='bookingstatus' />" +
      "    <attribute name='iroc_isinspectionrequired' />" +
      "    <attribute name='iroc_islate' />" +
      "    <attribute name='iroc_leaseinspectionid' />" +
      "    <attribute name='iroc_missedreason' />" +
      "    <attribute name='iroc_padid' />" +
      "    <attribute name='duration' />" +
      //// LAST THREE DAYS -  //////
      //"    <filter type='and'>" +
      //"      <condition attribute='starttime' operator='last-x-days' value='3'/>" +
      //"    </filter>" +
      "<filter type='and' >" +
      "<condition attribute='starttime' operator='ge' value='" +
      date1 +
      "' />" +
      "<condition attribute='starttime' operator='lt' value='" +
      date2 +
      "' />" +
      "</filter>" +
      //////////////////////

      "    <order attribute='starttime' descending='true' />" +
      "    <link-entity name='account' from='accountid' to='iroc_padid' link-type='outer' alias='pad'>" +
      "      <attribute name='iroc_foremangroup' />" +
      "      <attribute name='iroc_lastschedulevisitcompletedate' />" +
      "      <attribute name='iroc_tierid' />" +
      "    </link-entity>" +
      "    <link-entity name='bookingstatus' from='bookingstatusid' to='bookingstatus' link-type='inner' alias='bs'>" +
      "      <attribute name='description' />" +
      "      <attribute name='msdyn_fieldservicestatus' />" +
      "      <attribute name='bookingstatusid' />" +
      //// COMPLETED OR MISSED //////
      "      <filter type='or'>" +
      "        <condition attribute='msdyn_fieldservicestatus' operator='eq' value='690970004'/>" +
      "        <condition attribute='msdyn_fieldservicestatus' operator='eq' value='929530000'/>" +
      "      </filter>" +
      /////////////////////////////

      "    </link-entity>" +
      "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder'  link-type='inner'  alias='wo'>" +
      "      <attribute name='msdyn_workordertype' />" +
      "      <attribute name='msdyn_serviceaccount' />" +
      "      <attribute name='msdyn_workorderid' />" +
      "      <link-entity name='msdyn_workordertype' from='msdyn_workordertypeid' to='msdyn_workordertype'  link-type='inner'  alias='wot'>" +
      "        <attribute name='iroc_color' />" +
      "        <attribute name='iroc_jobtypecategory' />" +
      "      </link-entity>" +
      "    </link-entity>" +
      "    <link-entity name='bookableresource' from='bookableresourceid' to='resource'  link-type='inner'  alias='br'>" +
      "      <attribute name='iroc_irocresourcetype' />" +
      "      <attribute name='iroc_mbevisitownershipid' />" +
      "      <link-entity name='bookableresourcecategoryassn' from='resource' to='bookableresourceid'  link-type='inner'  alias='brca'>" +
      " <attribute name='resourcecategory' />" +
      ///IMPORTANT!!  We are using the foreman group from the bookable resource category of the bookable resource not the foremangroup of the pad.
      "        <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory' link-type='inner' alias='brc'>" +
      "          <attribute name='description' />" +
      "          <attribute name='iroc_foremangroup' />" +
      "          <attribute name='iroc_foremanqueueid' />" +
      "        </link-entity>" +
      "      </link-entity>" +
      "    </link-entity>" +
      "  </entity>" +
      "</fetch>";
    return fetchXmlComplete;
  },
  buildFetch: function () {
    // document.getElementById("loader").style.display = "block";
    var date1 = FS.SelectedDate.toLocaleDateString();
    var date2 = FS.SelectedDatePlus1.toLocaleDateString();
    //       MobileCRM.bridge.alert("buildFetchCompleted-" + date1);
    var fetchXml =
      "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' count='1000'>" +
      "  <entity name='bookableresourcebooking'>" +
      "    <attribute name='bookingstatus' />" +
      "    <attribute name='bookableresourcebookingid' />" +
      "    <attribute name='name' />" +
      "    <attribute name='starttime' />" +
      "    <attribute name='msdyn_workorder' />" +
      "    <attribute name='resource' />" +
      "    <attribute name='bookingstatus' />" +
      "    <attribute name='iroc_isinspectionrequired' />" +
      "    <attribute name='iroc_islate' />" +
      "    <attribute name='iroc_leaseinspectionid' />" +
      "    <attribute name='iroc_missedreason' />" +
      "    <attribute name='iroc_padid' />" +
      "    <attribute name='duration' />" +
      "    <order attribute='starttime' descending='true' />" +
      "<filter type='and' >" +
      "<condition attribute='starttime' operator='ge' value='" +
      date1 +
      "' />" +
      "<condition attribute='starttime' operator='lt' value='" +
      date2 +
      "' />" +
      "</filter>" +
      "    <link-entity name='account' from='accountid' to='iroc_padid' link-type='outer' alias='pad'>" +
      "      <attribute name='iroc_foremangroup' />" +
      "      <attribute name='iroc_lastschedulevisitcompletedate' />" +
      "      <attribute name='iroc_tierid' />" +
      "    </link-entity>" +
      "    <link-entity name='bookingstatus' from='bookingstatusid' to='bookingstatus' link-type='inner' alias='bs'>" +
      "      <attribute name='description' />" +
      "      <attribute name='msdyn_fieldservicestatus' />" +
      "      <attribute name='bookingstatusid' />" +
      //// SCHEDULED  even if in the past //////
      "      <filter type='and'>" +
      "        <condition attribute='msdyn_fieldservicestatus' operator='eq' value='690970000'/>" +
      "      </filter>" +
      ////////////////////////////

      "    </link-entity>" +
      "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder' link-type='inner' alias='wo'>" +
      "      <attribute name='msdyn_workordertype' />" +
      "      <attribute name='msdyn_serviceaccount' />" +
      "      <attribute name='msdyn_workorderid' />" +
      "      <link-entity name='msdyn_workordertype' from='msdyn_workordertypeid' to='msdyn_workordertype' link-type='inner' alias='wot'>" +
      "        <attribute name='iroc_color' />" +
      "        <attribute name='iroc_jobtypecategory' />" +
      "      </link-entity>" +
      "    </link-entity>" +
      "    <link-entity name='bookableresource' from='bookableresourceid' to='resource' link-type='inner' alias='br'>" +
      "      <attribute name='iroc_irocresourcetype' />" +
      "      <attribute name='iroc_mbevisitownershipid' />" +
      "      <link-entity name='bookableresourcecategoryassn' from='resource' to='bookableresourceid' link-type='inner' alias='brca'>" +
      " <attribute name='resourcecategory' />" +
      ///IMPORTANT!!  We are using the foreman group from the bookable resource category of the bookable resource  not the foremangroup of the pad.
      "        <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory' link-type='inner' alias='brc'>" +
      "          <attribute name='description' />" +
      "          <attribute name='iroc_foremangroup' />" +
      "          <attribute name='iroc_foremanqueueid' />" +
      "        </link-entity>" +
      "      </link-entity>" +
      "    </link-entity>" +
      "  </entity>" +
      "</fetch>";
    return fetchXml;
  },
  getAllBRBs: function (fetchXml, fetchXmlComplete) {
    // MobileCRM.bridge.alert("getAllBRBs");
    countNonScheduled = 0;
    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function (defaultbrbrecords) {
        //   MobileCRM.bridge.alert("defaultbrbrecords " + defaultbrbrecords.length);
        for (var i in defaultbrbrecords) {
          var brbrecords = defaultbrbrecords[i].properties;
          //Create Array List of Objects
          var newItem = new Object();
          newItem.BRBId = brbrecords.bookableresourcebookingid;
          newItem.BRBName = brbrecords["name"];
          newItem.PadName =
            brbrecords["wo.msdyn_serviceaccount"] === undefined ||
            brbrecords["wo.msdyn_serviceaccount"].primaryName === undefined
              ? "please refresh"
              : brbrecords["wo.msdyn_serviceaccount"].primaryName;
          newItem.PadId = brbrecords["wo.msdyn_serviceaccount"].id;

          //     newItem.PadName = brbrecords["iroc_padid"].primaryName === undefined || brbrecords["iroc_padid"].primaryName === null ? "please refresh" : brbrecords["iroc_padid"].primaryName;
          //     newItem.PadId = brbrecords["iroc_padid"].id;
          newItem.Color =
            brbrecords["wot.iroc_color"] === undefined
              ? "#fff"
              : brbrecords["wot.iroc_color"];
          newItem.BookingStatusName =
            brbrecords["bookingstatus"] === undefined ||
            brbrecords["bookingstatus"].primaryName === undefined
              ? "please refresh"
              : brbrecords["bookingstatus"].primaryName;
          newItem.BookingStatusId = brbrecords["bookingstatus"].id;
          newItem.LeaseRequired =
            brbrecords["iroc_isinspectionrequired"] === undefined
              ? false
              : brbrecords["iroc_isinspectionrequired"];
          newItem.LeaseLink =
            brbrecords["iroc_leaseinspectionid"] === undefined
              ? i
              : brbrecords["iroc_leaseinspectionid"].id;
          newItem.ForemanGroupName = "";
          newItem.ForemanGroupPicklistValue =
            brbrecords["brc.iroc_foremangroup"] === undefined
              ? null
              : brbrecords["brc.iroc_foremangroup"];
          newItem.ForemanGroupBRCId = "";
          newItem.ResourceName =
            brbrecords["resource"] === undefined ||
            brbrecords["resource"].primaryName === undefined ||
            brbrecords["resource"].primaryName === null
              ? "please refresh"
              : brbrecords["resource"].primaryName;
          //=== undefined ? "please refresh" : brbrecords["bookingstatus"].primaryName
          newItem.ResourceId =
            brbrecords["resource"] === undefined
              ? ""
              : brbrecords["resource"].id;
          newItem.ResourceCategory =
            brbrecords["brca.resourcecategory"] === undefined ||
            brbrecords["brca.resourcecategory"].primaryName === undefined ||
            brbrecords["brca.resourcecategory"].primaryName === null
              ? "please refresh"
              : brbrecords["brca.resourcecategory"].primaryName;
          newItem.ResourceCategoryId =
            brbrecords["brca.resourcecategory"] === undefined
              ? ""
              : brbrecords["brca.resourcecategory"].id;
          newItem.StartTime =
            brbrecords["starttime"] === undefined
              ? null
              : brbrecords["starttime"];
          newItem.Duration =
            brbrecords["duration"] === undefined
              ? null
              : brbrecords["duration"];
          newItem.MissedReason =
            brbrecords["iroc_missedreason"] === undefined
              ? ""
              : brbrecords["iroc_missedreason"];
          var fieldServiceStatus =
            brbrecords["bs.msdyn_fieldservicestatus"] === undefined
              ? null
              : brbrecords["bs.msdyn_fieldservicestatus"];
          if (
            fieldServiceStatus != null &&
            fieldServiceStatus.toString() == "929530000"
          ) {
            //Missed
            newItem.MissedStatus = true;
          } else {
            newItem.MissedStatus = false;
          }
          newItem.JobType =
            brbrecords["wot.iroc_jobtypecategory"] === undefined
              ? null
              : brbrecords["wot.iroc_jobtypecategory"];
          newItem.JobTypeText = "";
          newItem.Completed = false;
          ///////////////////////////////////////////
          newItem.Late =
            brbrecords["iroc_islate"] === undefined
              ? false
              : brbrecords["iroc_islate"];
          newItem.LateSort = newItem.Late ? 10 : 50;
          var sortOrder = 7 + newItem.LateSort;
          switch (newItem.JobType) {
            case 929530002: //Alarm
              sortOrder = 1 + newItem.LateSort;
              break;
            case 929530001: //Maintenance
              sortOrder = 2 + newItem.LateSort;
              break;
            case 929530003: //Workover visit
              sortOrder = 3 + newItem.LateSort;
              break;
            case 929530004: //SWD visit
              sortOrder = 4 + newItem.LateSort;
              break;
            case 929530000: //Schedule visit
              sortOrder = 5 + newItem.LateSort;
              break;
            case 929530005: //Office
              sortOrder = 6 + newItem.LateSort;
          }
          newItem.SortOrder = sortOrder;
          FS.BRBItemList.push(newItem);
        }
        MobileCRM.FetchXml.Fetch.executeFromXML(
          fetchXmlComplete,
          function (defaultbrbrecords) {
            // MobileCRM.bridge.alert("defaultbrbrecords fetchXmlComplete " + defaultbrbrecords.length);
            for (var i in defaultbrbrecords) {
              var brbrecords = defaultbrbrecords[i].properties;
              //Create Array List of Objects
              var newItem = new Object();
              newItem.BRBId = brbrecords.bookableresourcebookingid;
              newItem.BRBName = brbrecords["name"];

              //brbrecords["wo.msdyn_serviceaccount"]
              newItem.PadName =
                brbrecords["wo.msdyn_serviceaccount"] === undefined ||
                brbrecords["wo.msdyn_serviceaccount"].primaryName === undefined
                  ? "please refresh"
                  : brbrecords["wo.msdyn_serviceaccount"].primaryName;
              newItem.PadId = brbrecords["wo.msdyn_serviceaccount"].id;

              //     newItem.PadName = brbrecords["iroc_padid"].primaryName === undefined || brbrecords["iroc_padid"].primaryName === null ? "please refresh" : brbrecords["iroc_padid"].primaryName;
              //     newItem.PadId = brbrecords["iroc_padid"].id;
              newItem.Color =
                brbrecords["wot.iroc_color"] === undefined
                  ? "#fff"
                  : brbrecords["wot.iroc_color"];
              newItem.BookingStatusName =
                brbrecords["bookingstatus"] === undefined ||
                brbrecords["bookingstatus"].primaryName === undefined
                  ? "please refresh"
                  : brbrecords["bookingstatus"].primaryName;
              newItem.BookingStatusId = brbrecords["bookingstatus"].id;
              newItem.LeaseRequired =
                brbrecords["iroc_isinspectionrequired"] === undefined
                  ? false
                  : brbrecords["iroc_isinspectionrequired"];
              newItem.LeaseLink =
                brbrecords["iroc_leaseinspectionid"] === undefined
                  ? i
                  : brbrecords["iroc_leaseinspectionid"].id;
              newItem.ForemanGroupName = "";
              newItem.ForemanGroupPicklistValue =
                brbrecords["brc.iroc_foremangroup"] === undefined
                  ? null
                  : brbrecords["brc.iroc_foremangroup"];
              newItem.ForemanGroupBRCId = "";
              newItem.ResourceName =
                brbrecords["resource"] === undefined ||
                brbrecords["resource"].primaryName === undefined ||
                brbrecords["resource"].primaryName === null
                  ? "please refresh"
                  : brbrecords["resource"].primaryName;

              newItem.ResourceId =
                brbrecords["resource"] === undefined
                  ? ""
                  : brbrecords["resource"].id;
              newItem.ResourceCategory =
                brbrecords["brca.resourcecategory"] === undefined ||
                brbrecords["brca.resourcecategory"].primaryName === undefined ||
                brbrecords["brca.resourcecategory"].primaryName === null
                  ? "please refresh"
                  : brbrecords["brca.resourcecategory"].primaryName;
              newItem.ResourceCategoryId =
                brbrecords["brca.resourcecategory"] === undefined
                  ? ""
                  : brbrecords["brca.resourcecategory"].id;
              newItem.StartTime =
                brbrecords["starttime"] === undefined
                  ? null
                  : brbrecords["starttime"];
              newItem.Duration =
                brbrecords["duration"] === undefined
                  ? null
                  : brbrecords["duration"];
              newItem.MissedReason =
                brbrecords["iroc_missedreason"] === undefined
                  ? ""
                  : brbrecords["iroc_missedreason"];
              var fieldServiceStatus =
                brbrecords["bs.msdyn_fieldservicestatus"] === undefined
                  ? null
                  : brbrecords["bs.msdyn_fieldservicestatus"];
              if (
                fieldServiceStatus != null &&
                fieldServiceStatus.toString() == "929530000"
              ) {
                //Missed
                newItem.MissedStatus = true;
              } else {
                newItem.MissedStatus = false;
              }
              newItem.JobType =
                brbrecords["wot.iroc_jobtypecategory"] === undefined
                  ? null
                  : brbrecords["wot.iroc_jobtypecategory"];

              newItem.JobTypeText = "";
              newItem.Completed = true;
              newItem.Late =
                brbrecords["iroc_islate"] === undefined
                  ? false
                  : brbrecords["iroc_islate"];
              newItem.LateSort = newItem.Late ? 10 : 50;

              var sortOrder = 7 + newItem.LateSort;
              switch (newItem.JobType) {
                case 929530002: //Alarm
                  sortOrder = 1 + newItem.LateSort;
                  break;
                case 929530001: //Maintenance
                  sortOrder = 2 + newItem.LateSort;
                  break;
                case 929530003: //Workover visit
                  sortOrder = 3 + newItem.LateSort;
                  break;
                case 929530004: //SWD visit
                  sortOrder = 4 + newItem.LateSort;
                  break;
                case 929530000: //Schedule visit
                  sortOrder = 5 + newItem.LateSort;
                  break;
                case 929530005: //Office
                  sortOrder = 6 + newItem.LateSort;
              }

              newItem.SortOrder = sortOrder;

              FS.BRBItemList.push(newItem);
            }
            if (FS.FirstTimeLoad) {
              FS.RouteBoard.loadResourceGroups();
            } else {
              FS.RouteBoard.applyFilters();
            }
          },
          function (error) {
            MobileCRM.bridge.alert("Get BRBs1 Error: " + error);
          },
          null
        );
      },
      function (error) {
        MobileCRM.bridge.alert("Get BRBs2 Error: " + error);
      },
      null
    );
  },
  applyFilters: function () {
    debugger;
    $("#noRecords").hide();
    var tempDayArray = FS.BRBItemList;
    // MobileCRM.bridge.alert("BRBItemList " + tempDayArray.length);
    //Filter to selected day
    var todayIs = FS.SelectedDate;
    var todayIsStart = new Date(
      todayIs.getFullYear(),
      todayIs.getMonth(),
      todayIs.getDate(),
      00,
      00,
      00,
      00
    );
    var todayIsEnd = new Date(
      todayIs.getFullYear(),
      todayIs.getMonth(),
      todayIs.getDate(),
      23,
      59,
      59,
      59
    );

    tempDayArray = $.grep(
      FS.BRBItemList,
      function (n, i) {
        return n.StartTime >= todayIsStart && n.StartTime <= todayIsEnd;
      },
      false
    );

    // MobileCRM.bridge.alert("tempDayArray " + tempDayArray.length);
    //MobileCRM.bridge.alert(" tempDayArray " + tempDayArray.length + " " + FS.SelectedDate);
    //Filter to Completed/Scheduled Toggle
    var tempScheduled = tempDayArray;
    var bScheduled = true;

    if (FS.SelectedToggle === "Completed") {
      bScheduled = false;
      tempScheduled = $.grep(
        tempDayArray,
        function (n, i) {
          return n.Completed != bScheduled;
        },
        false
      );
    }

    if (FS.SelectedToggle === "Scheduled") {
      bScheduled = true;
      tempScheduled = $.grep(
        tempDayArray,
        function (n, i) {
          return n.Completed != bScheduled;
        },
        false
      );
    }

    if (
      FS.SelectedToggle === "Scheduled" &&
      FS.SelectedToggle2 === "Completed"
    ) {
      tempScheduled = $.grep(
        tempDayArray,
        function (n, i) {
          return n;
        },
        false
      );
    }

    // MobileCRM.bridge.alert("tempScheduled " + tempScheduled.length);
    //Filter the BRB Array to just the selected foreman groups UNLESS there are selected Resources then we select just move on to resource filter
    var tempForemanArray = tempScheduled;
    if (
      FS.SelectedForemanGroups.length > 0 &&
      FS.SelectedResources.length == 0
    ) {
      tempForemanArray = jQuery.grep(tempScheduled, function (n, i) {
        for (var s = 0; s < FS.SelectedForemanGroups.length; s++) {
          if (
            n.ForemanGroupPicklistValue.toString() ===
            FS.SelectedForemanGroups[s].toString()
          ) {
            return true;
          }
          if (s == FS.SelectedForemanGroups.length - 1) {
            return false;
          }
        }
      });
    }
    // MobileCRM.bridge.alert("tempForemanArray " + tempForemanArray.length);
    //Filter to Resources
    var tempResources = tempForemanArray;
    if (FS.SelectedResources.length > 0) {
      tempResources = jQuery.grep(tempForemanArray, function (n, i) {
        for (var s = 0; s < FS.SelectedResources.length; s++) {
          if (n.ResourceId === FS.SelectedResources[s]) {
            return true;
          }
          if (s == FS.SelectedResources.length - 1) {
            return false;
          }
        }
      });
    }

    // MobileCRM.bridge.alert("tempResources " + tempResources.length);

    //Filter to JobTypes
    var tempJobTypes = tempResources;

    if (FS.SelectedJobTypes.length > 0) {
      tempJobTypes = jQuery.grep(tempResources, function (n, i) {
        for (var s = 0; s < FS.SelectedJobTypes.length; s++) {
          if (n.JobType.toString() === FS.SelectedJobTypes[s].toString()) {
            return true;
          }
          if (s == FS.SelectedJobTypes.length - 1) {
            return false;
          }
        }
      });
    }
    // MobileCRM.bridge.alert("tempJobTypes " + tempJobTypes.length);
    //Remove any duplicates.  There could be duplicates if for example the Resource belongs to two foremans. There will be a
    // record for Foreman1 and for Foreman2 if filtering for both foremans. But we want to remove one of these as foreman is
    // only used for filtering and not show on the form in the returned data. Does not matter which we remove.
    const seen = new Set();
    var buildTableArry = tempJobTypes.filter((el) => {
      const duplicate = seen.has(el.BRBId);
      seen.add(el.BRBId);
      return !duplicate;
    });

    // MobileCRM.bridge.alert("buildTableArry " + buildTableArry.length);
    buildTableArry.sort(FS.RouteBoard.SortByBRBName);

    //MobileCRM.bridge.alert("after sort buildTableArry " + buildTableArry.length);

    FS.RouteBoard.buildTable(buildTableArry);

    //document.getElementById("loader").style.display = "none";
  },
  setClick: function () {
    $("#lbl").click(function (event) {
      //  MobileCRM.bridge.alert("click ");
      if ($("#toggleCheck").prop("checked")) {
        //alert("Was Checked1");
        $("#lbl").html("Scheduled");
        FS.RouteBoard.toggleFilterButtonComplete();
      } else {
        //alert("Was Not Checked2");
        $("#lbl").html("Complete");
        FS.RouteBoard.toggleFilterButtonScheduled();
      }
    });
  },
  toggleFilterButtonScheduled: function () {
    //  $("#buttoncomplete").show();
    //  $("#buttonscheduled").hide();
    FS.SelectedToggle = "Completed";

    FS.RouteBoard.applyFilters();
  },
  toggleFilterButtonComplete: function () {
    // $("#buttoncomplete").hide();
    // $("#buttonscheduled").show();
    FS.SelectedToggle = "Scheduled";

    FS.RouteBoard.applyFilters();
  },
  dateFilter: function (ev, object) {
    //Found in testing that object.value of "2020-03-01" when used in the next statement would return a date of Feb 29.  Therefore we are parsing out the string object.value
    debugger;
    //FS.SelectedDate = new Date(object.value);
    var year = parseInt(object.value.substring(0, 4));
    var month = parseInt(object.value.substring(5, 7)) - 1;
    var day = parseInt(object.value.substring(8, 10));
    var selectDateBuild = new Date(year, month, day);

    FS.SelectedDate = selectDateBuild;
    FS.SelectedDatePlus1.setDate(FS.SelectedDate.getDate() + 1);

    //Is this date in the array of data yet?  If not, get that information and buildtable before applyFilters
    if (FS.RetrievedDates.includes(FS.SelectedDate.toLocaleDateString())) {
      FS.RouteBoard.applyFilters();
    } else {
      //  MobileCRM.bridge.alert("!FS.RetrievedDates.includes(FS.SelectedDate)-" + FS.RetrievedDates + "  CHECKING: " + FS.SelectedDate.toLocaleDateString());
      var newFetch = FS.RouteBoard.buildFetch();
      //buildFetchCompleted
      var newFetch1 = FS.RouteBoard.buildFetchCompleted();
      FS.RouteBoard.getAllBRBs(newFetch, newFetch1);
      FS.RetrievedDates.push(FS.SelectedDate.toLocaleDateString());
    }
  },
  resourcegroupFilter: function () {
    $("#resourcefilter").multiselect({
      buttonWidth: "200px",
      numberDisplayed: 2,
      includeSelectAllOption: true,
      nonSelectedText: "All resources",
      onSelectAll: function () {
        //Clear all selected foremans
        FS.SelectedResources = [];

        FS.RouteBoard.applyFilters();
      },
      onDeselectAll: function () {
        //Clear all selected formans
        FS.SelectedResources = [];
      },
      onChange: function (option, checked, select) {
        if (checked) {
          FS.SelectedResources.push($(option).val());
        } else {
          for (var i = 0; i < FS.SelectedResources.length; i++) {
            if (FS.SelectedResources[i] === $(option).val()) {
              FS.SelectedResources.splice(i, 1);
            }
          }
        }
        FS.RouteBoard.applyFilters();
      },
    });
  },
  foremangroupFilter: function () {
    $("#foremangroupfilter").multiselect({
      buttonWidth: "200px",
      numberDisplayed: 2,
      nonSelectedText: "All Foreman Groups",
      includeSelectAllOption: true,
      onSelectAll: function () {
        //Clear all selected foremans
        FS.SelectedForemanGroups = [];
        FS.SelectedResources = [];

        FS.RouteBoard.rebuildResourceFilter();

      },
      onDeselectAll: function () {
        //Clear all selected formans
        FS.SelectedForemanGroups = [];
        FS.SelectedResources = [];

        FS.RouteBoard.rebuildResourceFilter();
      },
      onChange: function (option, checked, select) {
        //              alert('Changed foremangroupfilter option ' + $(option).val() + ' ' + checked);
        FS.SelectedResources = [];
        if (checked) {
          FS.SelectedForemanGroups.push($(option).val());
        } else {
          for (var i = 0; i < FS.SelectedForemanGroups.length; i++) {
            if (FS.SelectedForemanGroups[i] === $(option).val()) {
              FS.SelectedForemanGroups.splice(i, 1);
            }
          }
        }

        FS.RouteBoard.rebuildResourceFilter();
      },
    });
  },
  bookingStatusFilter: function () {
    $("#bookingStatusFilter").multiselect({
      buttonWidth: "200px",
      numberDisplayed: 2,
      nonSelectedText: "Booking Status",
      includeSelectAllOption: true,
      onSelectAll: function () {
        FS.SelectedToggle = "Scheduled";
        FS.SelectedToggle2 = "Completed";
        FS.RouteBoard.rebuildResourceFilter();
      },
      onDeselectAll: function () {
        FS.SelectedToggle = "Scheduled";
        FS.SelectedToggle2 = "";
        FS.RouteBoard.rebuildResourceFilter();
      },
      onChange: function (option, checked, select) {
        let allSelected = new Array();
        $("#bookingStatusFilter option:selected").map(function (a, item) {
          allSelected.push(this.value);
        });
        //is scheduled and completed  selected
        if (allSelected.length == 2) {
          FS.SelectedToggle = "Scheduled";
          FS.SelectedToggle2 = "Completed";
          FS.RouteBoard.rebuildResourceFilter();
        } else {
          if (allSelected[0] === "Scheduled") {
            FS.SelectedToggle = "Scheduled";
            FS.SelectedToggle2 = "";
          } else {
            FS.SelectedToggle = "Completed";
            FS.SelectedToggle2 = "";
          }
        }
        if (allSelected.length == 0) {
          FS.SelectedToggle = "Scheduled";
          FS.SelectedToggle2 = "";
        }
        allSelected = []; //clear array

        FS.RouteBoard.rebuildResourceFilter();
      },
    });
  },
  removeAllOptions: function () {
    this.destroy();
    this.$element.find("option").remove();
    this.$element.multiselect({});
  },
  rebuildResourceFilter: function () {
    //For each selected foreman group, get the unique resource for them an rebuild the dropdown.
    FS.SelectedResources = [];
    //Clear the current options
    //document.getElementById('resourcefilter').options.length = 0;
    //  $('#resourcefilter').multiselect('destroy');
    // $('#resourcefilter').empty().multiselect('refresh');
    // $('#resourcefilter').empty();
    if (!FS.FirstTimeLoad) {
      $("#resourcefilter").multiselect("destroy");
      document.getElementById("resourcefilter").options.length = 0;
      //  $('#resourcefilter').multiselect(FS.RouteBoard.removeAllOptions);
      //   $('#resourcefilter').empty();
    }

    var resourceListGroup = document.getElementById("resourcefilter");
    //   MobileCRM.bridge.alert("FS.CurrentUserBRId-" + FS.CurrentUserBRId)
    //if (FS.SelectedForemanGroups.length > 0) {
    //    var mesasage = "";
    //    for (var s = 0; s < FS.SelectedForemanGroups.length; s++) {
    //        mesasage = mesasage + FS.SelectedForemanGroups[s] + " ";
    //    }
    //    MobileCRM.bridge.alert("FS.SelectedForemanGroups- " + mesasage);
    //}
    if (FS.SelectedForemanGroups.length > 0) {
      //Get just the resources for the selected foremans.  Ccan return the same person more than once if they are in multiple ForemanGroups
      var filteredResourceArray = jQuery.grep(FS.AllResources, function (n, i) {
        if (FS.SelectedForemanGroups.includes(n.BRCForemanPicklist)) {
          return true;
        } else {
          return false;
        }
      });
      var beforeCount = filteredResourceArray.length;
      //Remove duplicates that might be in list due to being in more than one foreman group
      var seen = new Set();
      var filteredResourceUniqueArray = filteredResourceArray.filter((el) => {
        const duplicate = seen.has(el.BRId);
        seen.add(el.BRId);
        return !duplicate;
      });
      var afterCount = filteredResourceUniqueArray.length;
      // MobileCRM.bridge.alert("Before - " + beforeCount + " After " + afterCount);

      if (filteredResourceUniqueArray.length > 0) {
        filteredResourceUniqueArray.sort(FS.RouteBoard.SortByBRName);
      }
      for (var j = 0; j < filteredResourceUniqueArray.length; j++) {
        // resourceListGroup.options[j] = new Option(filteredResourceArray[j].BRName, filteredResourceArray[j].BRId);
        var name = filteredResourceUniqueArray[j].BRName;
        var picklistValue = filteredResourceUniqueArray[j].BRId;
        var bSelected = false;

        //Set to selected if firsttime and current user, route or queue
        if (FS.FirstTimeLoad) {
          if (FS.thisUserRoutes.includes(picklistValue)) {
            bSelected = true;
          }
          if (FS.thisUserForemanQueues.includes(picklistValue)) {
            bSelected = true;
          }
          if (FS.ForemanQueues.includes(picklistValue)) {
            bSelected = true;
          }
          if (FS.CurrentUserBRId.toString() == picklistValue.toString()) {
            bSelected = true;
          }
        }
        resourceListGroup.options[j] = new Option(name, picklistValue);
        if (bSelected) {
          resourceListGroup.options[j].selected = true;
          FS.SelectedResources.push(picklistValue);
        }
      }
    } else {
      //AllResourcesUniqueBR
      if (FS.AllResourcesUniqueBR.length > 0) {
        FS.AllResourcesUniqueBR.sort(FS.RouteBoard.SortByBRName);
      }

      for (var j = 0; j < FS.AllResourcesUniqueBR.length; j++) {
        // resourceListGroup.options[j] = new Option(filteredResourceArray[j].BRName, filteredResourceArray[j].BRId);
        var bSelected = false;
        var name = FS.AllResourcesUniqueBR[j].BRName;
        var picklistValue = FS.AllResourcesUniqueBR[j].BRId;
        // Default to any routes user is in, the ForemanGroup Queue and the current user
        //Set to selected if firsttime and current user, route or queue
        if (FS.FirstTimeLoad) {
          if (FS.thisUserRoutes.includes(picklistValue)) {
            bSelected = true;
          }
          if (FS.ForemanQueues.includes(picklistValue)) {
            bSelected = true;
          }
          if (FS.CurrentUserBRId.toString() == picklistValue.toString()) {
            bSelected = true;
          }
        }
        resourceListGroup.options[j] = new Option(name, picklistValue);
        if (bSelected) {
          resourceListGroup.options[j].selected = true;
          FS.SelectedResources.push(picklistValue);
        }
      }
    }

    //   $('#resourcefilter').multiselect('refresh');

    // options.sort(FS.RouteBoard.SortByLabel);
    // $('#resourcefilter').multiselect('setOptions', resourcefilterConfigurationSet);
    // $('#resourcefilter').multiselect('dataprovider', options);
    if (FS.FirstTimeLoad) {
      FS.FirstTimeLoad = false;
    }

    FS.RouteBoard.resourcegroupFilter();
    FS.RouteBoard.applyFilters();
  },
  //BRBName
  SortByBRBName: function (a, b) {
    var o1 = a.SortOrder;
    var o2 = b.SortOrder;

    var p1 = a.BRBName.toLowerCase();
    var p2 = b.BRBName.toLowerCase();

    if (o1 < o2) return -1;
    if (o1 > o2) return 1;
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
    return 0;
  },
  //SortByBRName
  SortByBRName: function (a, b) {
    var aName = a.BRName.toLowerCase();
    var bName = b.BRName.toLowerCase();
    return aName < bName ? -1 : aName > bName ? 1 : 0;
  },
  //Sort the options
  SortByLabel: function (a, b) {
    var aName = a.label.toLowerCase();
    var bName = b.label.toLowerCase();
    return aName < bName ? -1 : aName > bName ? 1 : 0;
  },
  getSafetyNotifications: function () {
    //For this user in the last 24 hours
    var fetchData = {
      iroc_userid: FS.CurrentUser,
      createdon: "24",
    };
    var fetchXml = [
      "<fetch resultformat='JSON' version='1.0' aggregate='false'>",
      "  <entity name='iroc_notificationsend'>",
      "    <attribute name='iroc_foremangroup' />",
      "    <attribute name='iroc_userid' />",
      "    <attribute name='createdon' />",
      "    <attribute name='iroc_snrefnumber' />",
      "    <filter type='and'>",
      "      <condition attribute='iroc_userid' operator='eq' value='",
      fetchData.iroc_userid,
      "'/>",
      "      <condition attribute='createdon' operator='last-x-hours' value='",
      fetchData.createdon,
      "'/>",
      "    </filter>",
      "  </entity>",
      "</fetch>",
    ].join("");

    MobileCRM.FetchXml.Fetch.executeFromXML(
      fetchXml,
      function (snrecords) {
        if (snrecords.length > 0) {
          $("#safetyicon").show();
        } else {
          $("#safetyicon").hide();
        }
      },
      function (error) {
        $("#safetyicon").hide();
        MobileCRM.bridge.alert("Get SN Error: " + error);
      },
      null
    );
  },
  loadForemanGroup: function (foremanList) {
    FS.AllForemanGroups = [];
    var foremanListGroup = document.getElementById("foremangroupfilter");
    FS.SelectedForemanGroups = [];

    //Clear the current options
    document.getElementById("foremangroupfilter").options.length = 0;

    for (var i = 0; i < foremanList.length; i++) {
      var recordUser =
        foremanList[i].User == undefined ? "" : foremanList[i].User.id;
      var bSelected = false;
      //Is this person on any routes that need to be autoselected too?
      if (FS.thisUserForemans.includes(foremanList[i].BRCForemanId)) {
        bSelected = true;
      }
      var picklistValue = foremanList[i].BRCForemanPicklist;
      var name = foremanList[i].BRCForemanName;
      foremanListGroup.options[i] = new Option(name, picklistValue, bSelected);
      if (bSelected) {
        foremanListGroup.options[i].selected = true;
        FS.SelectedForemanGroups.push(picklistValue);
      }
      var saveForeman = new Object();
      saveForeman.PicklistValue = picklistValue;
      saveForeman.BRCId = foremanList[i].BRCForemanId;
      saveForeman.Name = name;
      FS.AllForemanGroups.push(saveForeman);
      if (foremanList[i].BRCQueueId != null) {
        FS.ForemanQueues.push(foremanList[i].BRCQueueId);
      }
    }
    FS.RouteBoard.foremangroupFilter();
    FS.RouteBoard.rebuildResourceFilter();
  },

  loadResourceGroups: function () {
    //  MobileCRM.bridge.alert("loadResourceGroups");
    var resourceFetchXML;
    FS.AllResources = [];
    var fetchData = {
      statecode: "0",
      iroc_irocresourcetype: "929530002",
      iroc_irocresourcetype2: "929530001",
      iroc_irocresourcetype3: "929530000",
      iroc_irocresourcetype4: "929530003",
    };
    var resourceFetchXML = [
      "<fetch version='1.0' resultformat='JSON' mapping='logical'>",
      "  <entity name='bookableresource'>",
      "    <attribute name='bookableresourceid' />",
      "    <attribute name='resourcetype' />",
      "    <attribute name='name' />",
      "    <attribute name='iroc_irocresourcetype' />",
      "    <attribute name='userid' />",
      "    <attribute name='statecode' />",
      "    <attribute name='iroc_mbevisitownershipid' />",
      "    <filter type='and'>",
      "      <condition attribute='statecode' operator='eq' value='",
      fetchData.statecode /*0*/,
      "'/>",
      "      <filter type='or'>",
      "        <condition attribute='iroc_irocresourcetype' operator='eq' value='",
      fetchData.iroc_irocresourcetype /*929530002*/,
      "'/>",
      "        <condition attribute='iroc_irocresourcetype' operator='eq' value='",
      fetchData.iroc_irocresourcetype2 /*929530001*/,
      "'/>",
      "        <condition attribute='iroc_irocresourcetype' operator='eq' value='",
      fetchData.iroc_irocresourcetype3 /*929530000*/,
      "'/>",
      "        <condition attribute='iroc_irocresourcetype' operator='eq' value='",
      fetchData.iroc_irocresourcetype4 /*929530003*/,
      "'/>",
      "      </filter>",
      "    </filter>",
      "    <link-entity name='bookableresourcecategoryassn' from='resource' to='bookableresourceid' alias='brca'>",
      "      <attribute name='name' />",
      "      <attribute name='resource' />",
      "      <attribute name='resourcecategory' />",
      "      <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory' alias='brc'>",
      "        <attribute name='bookableresourcecategoryid' />",
      "        <attribute name='iroc_foremangroup' />",
      "        <attribute name='name' />",
      "        <attribute name='description' />",
      "        <attribute name='iroc_foremanqueueid' />",
      "      </link-entity>",
      "    </link-entity>",
      "    <link-entity name='team' from='teamid' to='iroc_mbevisitownershipid' link-type='outer' alias='t'>",
      "      <attribute name='description' />",
      "      <attribute name='name' />",
      "      <attribute name='teamid' />",
      "      <link-entity name='teammembership' from='teamid' to='teamid' link-type='outer' alias='tm' intersect='true'>",
      "        <attribute name='systemuserid' />",
      "      </link-entity>",
      "    </link-entity>",
      "  </entity>",
      "</fetch>",
    ].join("");

    //This fetch returns all the bookable resources and their foremans so we can build both dropdowns and store all data for future loads/selections.
    debugger;
    MobileCRM.FetchXml.Fetch.executeFromXML(
      resourceFetchXML,
      function (resourceList) {
        //  MobileCRM.bridge.alert("Resource Filter " + resourceList.length);
        FS.AllRouteOperators = [];
        FS.thisUserForemans = [];
        FS.thisUserForemanQueues = [];
        FS.thisUserForemanPicklist = [];
        FS.AllResources = [];
        for (var i = 0; i < resourceList.length; i++) {
          var name = resourceList[i]["name"];
          var user =
            resourceList[i]["tm.systemuserid"] === undefined
              ? null
              : resourceList[i]["tm.systemuserid"];
          if (user == null) {
            user =
              resourceList[i]["userid"] === undefined
                ? null
                : resourceList[i]["userid"];
          }
          var team =
            resourceList[i]["t.teamid"] === undefined
              ? null
              : resourceList[i]["t.teamid"];
          var routeOperators =
            resourceList[i]["tm.systemuserid"] === undefined
              ? null
              : resourceList[i]["tm.systemuserid"];
          var saveResource = new Object();
          saveResource.BRId = resourceList[i]["bookableresourceid"];
          saveResource.BRName = name;
          saveResource.BRType = resourceList[i]["iroc_irocresourcetype"];
          saveResource.BRCForemanId =
            resourceList[i]["brc.bookableresourcecategoryid"];
          saveResource.BRCQueueId =
            resourceList[i]["brc.iroc_foremanqueueid"] === undefined
              ? null
              : resourceList[i]["brc.iroc_foremanqueueid"];
          saveResource.User = user;
          saveResource.Team = team;
          saveResource.BRCForemanPicklist =
            resourceList[i]["brc.iroc_foremangroup"] === undefined
              ? null
              : resourceList[i]["brc.iroc_foremangroup"];
          saveResource.BRCForemanName = resourceList[i]["brc.name"];

          if (
            user != null &&
            user.id == FS.CurrentUser &&
            user.primaryName == saveResource.BRName
          ) {
            FS.CurrentUserBRId = saveResource.BRId;
          }
          FS.AllResources.push(saveResource);
          if (routeOperators !== null) {
            var saveRouteOperators = new Object();
            saveRouteOperators.RouteName = name;
            saveRouteOperators.RouteBRId =
              resourceList[i]["bookableresourceid"];
            saveRouteOperators.RouteBRCForemanId =
              resourceList[i]["brc.bookableresourcecategoryid"];
            saveRouteOperators.RouteBRCQueueId =
              resourceList[i]["brc.iroc_foremanqueueid"] === undefined
                ? null
                : resourceList[i]["brc.iroc_foremanqueueid"];
            saveRouteOperators.RouteUser = routeOperators;
            FS.AllRouteOperators.push(saveRouteOperators);
            if (routeOperators.id == FS.CurrentUser) {
              FS.thisUserRoutes.push(resourceList[i]["bookableresourceid"]);
            }
          }
          if (user != null && user.id == FS.CurrentUser) {
            FS.thisUserForemanPicklist.push(
              resourceList[i]["brc.iroc_foremangroup"]
            );
            FS.thisUserForemans.push(
              resourceList[i]["brc.bookableresourcecategoryid"]
            );
            FS.thisUserForemanQueues.push(
              resourceList[i]["brc.iroc_foremanqueueid"].id === undefined
                ? null
                : resourceList[i]["brc.iroc_foremanqueueid"].id
            );
          }
        }
        //Get just the unique resources as the array can return the same person more than once if they are in multiple ForemanGroups

        //    MobileCRM.bridge.alert(" AllResources: " + FS.AllResources.length);

        //Load the foremans from this dataset
        FS.AllResourcesUniqueForemans = [];
        //Remove duplicates that might be in list due to being in more than one foreman group
        const seenuniqueForemans = new Set();
        FS.AllResourcesUniqueForemans = FS.AllResources.filter((el) => {
          const duplicate = seenuniqueForemans.has(el.BRCForemanId);
          seenuniqueForemans.add(el.BRCForemanId);
          return !duplicate;
        });

        //Load all unique Bookable Resources
        FS.AllResourcesUniqueBR = [];

        //Remove duplicates that might be in list due to being in more than one foreman group
        const seen = new Set();
        FS.AllResourcesUniqueBR = FS.AllResources.filter((el) => {
          const duplicate = seen.has(el.BRId);
          seen.add(el.BRId);
          return !duplicate;
        });

        //Load the foreman groups -
        FS.RouteBoard.loadForemanGroup(FS.AllResourcesUniqueForemans);
      },
      function (error) {
        MobileCRM.bridge.alert("Resource Filter Error: " + error);
      },
      null
    );
  },

  addZero: function (num) {
    return num >= 0 && num < 10 ? "0" + num : num + "";
  },

  onbrbRowClick: function (e) {
    //  if (btnclicked == false) {
    var dataitem = e.id;
    MobileCRM.UI.FormManager.showDetailDialog("account", dataitem, null);
    //  }
    //  else {
    //      btnclicked = false;
    //  }
  },
  onLeaseClick: function (e) {
    var dataitem = e.id;
    MobileCRM.UI.FormManager.showEditDialog(
      "iroc_leaseinspection",
      dataitem,
      null
    );
  },
  onCreateRouteFeedClick: function (e) {
    //Get the BRB from the Array

    var result = FS.BRBItemList.find((obj) => {
      return obj.BRBId === e.id;
    });

    //    MobileCRM.bridge.alert(" result " + result);
    var padid = new MobileCRM.Reference(
      "account",
      result.PadId,
      result.PadName
    );
    var bookingid = new MobileCRM.Reference("bookableresourcebooking", e.id);
    var relationShip = new MobileCRM.Relationship(
      "iroc_bookingid",
      bookingid,
      null,
      null
    );
    MobileCRM.UI.FormManager.showNewDialog(
      "iroc_routefeed",
      relationShip,
      {
        "@initialize": {
          iroc_padid: padid,
        },
      },
      null
    );
    // btnclicked = true;
  },

  onAssignBtnClick: function (e) {
    brbRecordId = e.id;
    $("#card").hide();
    $("#toggleSwitch").hide();
    $("#reasons").hide();
    $("#assign").show();
    FS.RouteBoard.loadBRGroup();
  },

  loadBRGroup: function () {
    ////TO-DO:  Replace this with Global array - no need to requery database.
    //var brGroupFetchXML = "<fetch version='1.0' resultformat='JSON' mapping='logical'>" +
    //    "<entity name='bookableresource'>" +
    //    "<attribute name='name' />" +
    //    "<attribute name='createdon' />" +
    //    "<attribute name='resourcetype' />" +
    //    "<attribute name='bookableresourceid' />" +
    //    "<filter type='and'>" +
    //    "<condition attribute='statecode' operator='eq' value='0' />" +
    //    "</filter>" +
    //    "    <order attribute='resourcetype' />" +
    //    "    <order attribute='name' />" +
    //    "</entity>" +
    //    "</fetch>";

    //  FS.thisUserForemans.push(resourceList[i]['brc.bookableresourcecategoryid']);
    // FS.thisUserForemanQueues.push(resourceList[i]['brc.iroc_foremanqueueid'].id === undefined ? null : resourceList[i]['brc.iroc_foremanqueueid'].id);
    /*
         *  FS.AllResourcesUniqueBR
         *    saveResource.BRId = resourceList[i]['bookableresourceid'];
                    saveResource.BRName = name;
                    saveResource.BRType = resourceList[i]['iroc_irocresourcetype'];
                    saveResource.BRCForemanId = resourceList[i]['brc.bookableresourcecategoryid'];


for (var j = 0; j < FS.AllResourcesUniqueBR.length; j++) {
                // resourceListGroup.options[j] = new Option(filteredResourceArray[j].BRName, filteredResourceArray[j].BRId);
                var bSelected = false;
                var name = FS.AllResourcesUniqueBR[j].BRName;
                var picklistValue = FS.AllResourcesUniqueBR[j].BRId
                // Default to any routes user is in, the ForemanGroup Queue and the current user
                //Set to selected if firsttime and current user, route or queue
                if (FS.FirstTimeLoad) {
                    if (FS.thisUserRoutes.includes(picklistValue)) {
                        bSelected = true;
                    }
                    if (FS.ForemanQueues.includes(picklistValue)) {
                        bSelected = true;
                    }
                    if (FS.CurrentUserBRId.toString() == picklistValue.toString()) {
                        bSelected = true;
                    }
                }
                resourceListGroup.options[j] = new Option(name, picklistValue);
                if (bSelected) {
                    resourceListGroup.options[j].selected = true;
                    FS.SelectedResources.push(picklistValue);
                }

            }

 saveResource.BRCForemanPicklist = resourceList[i]['brc.iroc_foremangroup'] === undefined ? null : resourceList[i]['brc.iroc_foremangroup'];;
                    saveResource.BRCForemanName = resourceList[i]['brc.name'];


         * 
         */
    var brListGroup = document.getElementById("assigntofilter");
    brListGroup.options[0] = new Option(" ", "-1");
    var optionnumber = 0;
    for (var i = 0; i < FS.AllResourcesUniqueBR.length; i++) {
      var foremanGroupBRC = FS.AllResourcesUniqueBR[i].BRCForemanId;
      //  MobileCRM.bridge.alert("name: " + name + " " + i);
      var bSelected = false;
      if (FS.thisUserForemans.includes(foremanGroupBRC)) {
        var picklistValue = FS.AllResourcesUniqueBR[i].BRId;
        var name = FS.AllResourcesUniqueBR[i].BRName;

        //MobileCRM.bridge.alert("name: " + name + " " + i + " " + optionnumber);
        optionnumber++;
        brListGroup[optionnumber] = new Option(name, picklistValue);
        //Set to the default Foreman Group queue.  THe user may belong to more than oe foreman group so it would select the first one.
        if (!bSelected) {
          if (FS.thisUserForemanQueues.includes(picklistValue)) {
            bSelected = true;
            brListGroup.options[optionnumber].selected = true;
          }
        }
      }
    }

    //MobileCRM.FetchXml.Fetch.executeFromXML(
    //    brGroupFetchXML, function (brgrouplist) {
    //        var brListGroup = document.getElementById('assigntofilter');
    //        brListGroup.options[0] = new Option(' ', '-1');
    //        var bSelected = false;
    //        for (var i = 0; i < brgrouplist.length; i++) {
    //            var picklistValue = brgrouplist[i].bookableresourceid;
    //            var name = brgrouplist[i].name;
    //            brListGroup.options[i + 1] = new Option(name, picklistValue);
    //            //Set to the default Foreman Group queue.  THe user may belong to more than oe foreman group so it would select the first one.
    //            if (!bSelected) {
    //                if (FS.thisUserForemanQueues.includes(picklistValue)) {
    //                    bSelected = true;
    //                    brListGroup.options[i + 1].selected = true;
    //                }
    //            }
    //        }
    //    }, function (error) {
    //        MobileCRM.bridge.alert("loadBRGroup Error: " + error);
    //    }, null)
  },

  setResource: function (bookableresourcebooking) {
    var selectedOption = document.getElementById("assigntofilter");
    var bookableresourceText =
      selectedOption.options[selectedOption.selectedIndex].text;
    var bookableresourceId =
      selectedOption.options[selectedOption.selectedIndex].value;
    if (bookableresourceId == null || bookableresourceId.toString() == "-1") {
      $("#assignerror").show();
      return;
    }
    //document.getElementById("loader").style.display = "block";
    var resource = new MobileCRM.Reference(
      "bookableresource",
      bookableresourceId,
      bookableresourceText
    );
    bookableresourcebooking.properties["resource"] = resource;
    bookableresourcebooking.save(FS.RouteBoard.callBack);
  },

  callBack: function (error) {
    //document.getElementById("loader").style.display = "none";
    if (error) {
      MobileCRM.bridge.alert("An error occurred: " + error);
    } else {
      $("#assignerror").hide();
      $("#reasonerror").hide();
      MobileCRM.bridge.alert("Successfully saved");
      $("#reasons").hide();
      $("#assign").hide();
      FS.RouteBoard.refreshDataOnly();
    }
  },

  onAssign: function () {
    $("#logoLoader").show();
    MobileCRM.DynamicEntity.loadById(
      "bookableresourcebooking",
      brbRecordId,
      FS.RouteBoard.setResource,
      function (error) {
        $("#logoLoader").show();
        MobileCRM.bridge.alert("An error occurred: " + error);
      },
      null
    );
  },

  onClose: function () {
    $("#reasonerror").hide();
    FS.RouteBoard.displayRule();
    //No need to reload when the cancel action.
    // FS.RouteBoard.onloadFunction();
  },

  onReasonBtnClick: function (e) {
    brbRecordId = e.id;
    debugger;
    //        FS.SelectedBRBName = e.
    $("#card").hide();
    $("#toggleSwitch").hide();
    $("#assign").hide();
    document.getElementById("reasons").style.display = "block";
  },
  loadJobTypes: function () {
    $("#jobfilter").multiselect({
      buttonWidth: "200px",
      nonSelectedText: "All Job Types",
      includeSelectAllOption: true,
      numberDisplayed: 2,
      onSelectAll: function () {
        //Clear all job types
        FS.SelectedJobTypes = [];

        FS.RouteBoard.applyFilters();
      },
      onDeselectAll: function () {
        //Clear all job types
        FS.SelectedJobTypes = [];

        FS.RouteBoard.applyFilters();
      },
      onChange: function (option, checked, select) {
        if (checked) {
          FS.SelectedJobTypes.push($(option).val());
        } else {
          for (var i = 0; i < FS.SelectedJobTypes.length; i++) {
            if (FS.SelectedJobTypes[i] === $(option).val()) {
              FS.SelectedJobTypes.splice(i, 1);
            }
          }
        }
        //MobileCRM.bridge.alert("onchange " + FS.SelectedJobTypes);

        FS.RouteBoard.applyFilters();
      },
    });

    MobileCRM.Metadata.getOptionSetValues(
      "msdyn_workordertype",
      "iroc_jobtypecategory",
      function (optionSetValues) {
        var i = 0;
        var options = [];
        for (name in optionSetValues) {
          var val = optionSetValues[name];
          var optionItem = new Object();
          optionItem.label = name;
          optionItem.title = name;
          optionItem.value = val;
          options.push(optionItem);
        }
        options.sort(FS.RouteBoard.SortByLabel);
        $("#jobfilter").multiselect("dataprovider", options);
      },
      MobileCRM.bridge.alert,
      null
    );
  },
  loadReasons: function () {
    $("#reasonerror").hide();
    FS.MissedReasonLabels = [];
    MobileCRM.Metadata.getOptionSetValues(
      "bookableresourcebooking",
      "iroc_missedreason",
      function (optionSetValues) {
        var reason = document.getElementById("reason");
        reason.options[0] = new Option(" ", "-1");
        var i = 0;
        for (name in optionSetValues) {
          var val = optionSetValues[name];
          reason.options[i + 1] = new Option(name, val);
          i = i + 1;
          var reasons = new Object();
          reasons.PklValue = val;
          reasons.Label = name;
          FS.MissedReasonLabels.push(reasons);
          // MobileCRM.bridge.alert("val " + val + " name " + name);
        }
      },
      MobileCRM.bridge.alert,
      null
    );
  },
  onClickSafety: function () {
    MobileCRM.UI.IFrameForm.requestObject(
      function (iFrame) {
        MobileCRM.UI.IFrameForm.show(
          "Safety Flash",
          "file://MBENotifications/MyNotifications.html",
          false,
          (options = { test: "test" })
        );
      },
      MobileCRM.bridge.alert,
      null
    );
  },
  // Get formatted date YYYY-MM-DD
  getFormattedDate: function (date) {
    return (
      date.getFullYear() +
      "-" +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      "-" +
      ("0" + date.getDate()).slice(-2)
    );
  },
  today: function () {
    return new Date();
  },

  onSave: function () {
    var selectedOption = document.getElementById("reason");
    var reasonValue =
      selectedOption.options[selectedOption.selectedIndex].value;
    if (reasonValue == null || reasonValue.toString() == "-1") {
      $("#reasonerror").show();
      return;
    }
    $("#reasonerror").hide();
    $("#logoLoader").show();
    MobileCRM.DynamicEntity.loadById(
      "bookableresourcebooking",
      brbRecordId,
      FS.RouteBoard.SaveReason,
      function (error) {
        $("#logoLoader").hide();
        MobileCRM.bridge.alert("An error occurred: " + error);
      },
      null
    );
  },

  SaveReason: function (bookableresourcebooking) {
    var selectedOption = document.getElementById("reason");
    //   var reasonText = selectedOption.options[selectedOption.selectedIndex].text;
    var reasonValue =
      selectedOption.options[selectedOption.selectedIndex].value;
    bookableresourcebooking.properties["iroc_missedreason"] = reasonValue;
    var entity = new MobileCRM.FetchXml.Entity("bookingstatus");
    entity.addAttributes("name");
    entity.addAttributes("bookstatusid");
    var filter = new MobileCRM.FetchXml.Filter();
    filter.where("name", "eq", missedStatus);
    entity.filter = filter;
    var fetch = new MobileCRM.FetchXml.Fetch(entity);

    fetch.execute(
      "Array",
      function (result) {
        if (result.length == 0) {
          MobileCRM.bridge.alert(
            "ERROR - Could not find booking status named " + missedStatus
          );
        } else {
          for (var i in result) {
            var bookingstatus = result[i];
            var bookingid = bookingstatus[0];
            var bookingname = bookingstatus[6];
          }
          var status = new MobileCRM.Reference(
            "bookingstatus",
            bookingid,
            bookingname
          );
          bookableresourcebooking.properties["bookingstatus"] = status;
          bookableresourcebooking.save(FS.RouteBoard.callBack);
        }
      },
      function (err) {
        $("#logoLoader").hide();
        MobileCRM.bridge.alert("Error fetching accounts: " + err);
      },
      null
    );
  },
  createNewJob: function (e) {
    var foremanName = FS.thisUserForemanPicklist[0];
    MobileCRM.UI.FormManager.showNewDialog(
      "iroc_jobtransaction",
      null,
      {
        "@initialize": {
          iroc_foremangroup: foremanName,
        },
      },
      null
    );
  },
  createNewSafetyNotification: function (e) {
    MobileCRM.UI.FormManager.showNewDialog(
      "iroc_safetynotification",
      null,
      {},
      null
    );
  },
  createNewToggle: function (e) {
    $("#createNewModal").hide();
    let toggleControl = false; //hidden by default
    let createNewEventToggle = document.getElementById("createNewEvent");
    let closeNewEventToggle = document.getElementById("closeNewEvent");
    let clickedNewJobToggle = document.getElementById("clickedNewJob");
    let clickedSNToggle = document.getElementById("clickedSN");
    createNewEventToggle.addEventListener("click", handleNewToggle, false);
    closeNewEventToggle.addEventListener("click", handleNewToggle, false);
    clickedNewJobToggle.addEventListener("click", handleNewToggle, false);
    clickedSNToggle.addEventListener("click", handleNewToggle, false);
    function handleNewToggle() {
      if (toggleControl === false) {
        $("#createNewModal").show();
        toggleControl = true;
      } else {
        $("#createNewModal").hide();
        toggleControl = false;
      }
    }
  },
};
