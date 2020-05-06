/// <reference path="jsbridge.js" />
var btnclicked = false;
var brbRecordId = null;
var missedStatus = "Missed";
var resourcefilterConfigurationSet = {
    buttonWidth: '150px',
    includeSelectAllOption: true,
    nonSelectedText: 'All resources',
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
        }
        else {
            for (var i = 0; i < FS.SelectedResources.length; i++) {
                if (FS.SelectedResources[i] === $(option).val()) {
                    FS.SelectedResources.splice(i, 1);
                }
            }
        }
        FS.RouteBoard.applyFilters();
    }
};
var FS = FS || {};

FS.BRBItemList = [];
FS.AllForemanGroups = [];
FS.AllResources = [];
FS.AllResourcesUniqueBR = [];
FS.AllResourcesUniqueForemans = [];
FS.AllRouteOperators = [];
FS.CurrentUser = "";
FS.SelectedForemanGroups = [];
FS.SelectedResources = [];
FS.SelectedDate = new Date();
FS.SelectedToggle = "Scheduled";
FS.thisUserForemans = [];
FS.thisUserForemanQueues = [];
FS.FirstTimeLoad = false;
FS.RouteBoard = {
    onloadFunction: function () {
      //  MobileCRM.bridge.alert("onloadFunction");

        //Who is the current user?
        MobileCRM.Configuration.requestObject(
            function (config) {
                FS.FirstTimeLoad = true;
                var settings = config.settings;
               // MobileCRM.bridge.alert(settings.userName + " " + settings.userLogin + " " + settings.systemUserId);
                FS.CurrentUser = settings.systemUserId;
                FS.RouteBoard.toggleFilter();
                FS.RouteBoard.loadJobTypes();
                FS.RouteBoard.displayRule();

                //Set the datepicker to today
                $("#datefilter").val(FS.RouteBoard.getFormattedDate(FS.RouteBoard.today()));

                FS.SelectedDate = FS.RouteBoard.today();
                FS.RouteBoard.getAllBRBs();
                return false;
            },
            function (err) {
                /// <param name="err" type="String">/<param>
                MobileCRM.bridge.alert("An error occurred: " + err);
            },
            null
        );
    },
    displayRule: function () {
        document.getElementById("optionset").style.display = "block";
        document.getElementById("brblist").style.display = "block";
        document.getElementById("assign").style.display = "none";
        document.getElementById("reasons").style.display = "none";
    },
    buildTable: function (itemArray) {
        var table = document.getElementById("brbtablelist");
        table.tBodies[0].innerHTML = "";
        var brbRows = "";
        for (var i in itemArray) {
            var currentRecord = itemArray[i];
            var start = currentRecord.StartTime;
            var startdate = "";
            if (start !== null) {
                startdate = [[FS.RouteBoard.addZero(start.getUTCHours()),
                FS.RouteBoard.addZero(start.getUTCMinutes())].join(":"),
                start.getUTCHours() >= 12 ? "PM" : "AM"].join(" ");
            }
            var showHideIcons = "visible";
            var displayName = currentRecord.BRBName;
            //If the booking is complete we do not show the icons except for Lease Inspection if required.
            if (currentRecord.Completed) { displayName = displayName + " - " + currentRecord.BookingStatusName; showHideIcons = "hidden"; };
            brbRows = brbRows +
                "<tr style='font-weight: bold; id='" + currentRecord.BRBId + "' onclick='FS.RouteBoard.onbrbRowClick(this)'>" +
                "<td colspan='4'>" + displayName + "</td>" +
                "<td>" + startdate + "</td>" +
                "</tr>" +
                "<tr style='font-weight: normal; border-bottom: 3px solid #000; background-color: " + currentRecord.Color + "'>" +
                "<td style='width: 40%'>" + currentRecord.ResourceName + "</td>" +
                "<td style='width: 15%; max-height=25'><img id=" + currentRecord.BRBId + " style='height: 25px; visibility: "+ showHideIcons + "' src='feed.svg' onclick='FS.RouteBoard.onCreateRouteFeedClick(this)'></td>" +
                "<td style='width: 15%'><img id=" + currentRecord.BRBId + " style='height: 25px; visibility: " + showHideIcons + "' src='missed.svg' onclick='FS.RouteBoard.onReasonBtnClick(this)'></td>" +
                "<td style='width: 15%'><img id=" + currentRecord.BRBId + " style='height: 25px; visibility: " + showHideIcons + "' src='reassign.svg'  onclick='FS.RouteBoard.onAssignBtnClick(this)'></td>";

            if (currentRecord.LeaseRequired) {
                brbRows = brbRows + "<td style='width: 15%' ><img id=" + currentRecord.LeaseLink + " style='height: 25px'  src='lease.svg' onclick='FS.RouteBoard.onLeaseClick(this)'</td></tr>";
            }
            else {
                brbRows = brbRows + "<td style='width: 15%' >&nbsp;</td></tr>";
            }
            
         
        }
        table.tBodies[0].innerHTML += brbRows;
    },
    getAllBRBs: function () {
       // MobileCRM.bridge.alert("getAllBRBs");
        //Scheduled bookings all
        var fetchXml = "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false'>" +
            "  <entity name='bookableresourcebooking'>"+
            "    <attribute name='bookingstatus' />"+
            "    <attribute name='bookableresourcebookingid' />"+
            "    <attribute name='name' />"+
            "    <attribute name='starttime' />"+
            "    <attribute name='msdyn_workorder' />"+
            "    <attribute name='resource' />"+
            "    <attribute name='bookingstatus' />"+
            "    <attribute name='iroc_isinspectionrequired' />"+
            "    <attribute name='iroc_leaseinspectionid' />"+
            "    <attribute name='iroc_padid' />"+
            "    <attribute name='duration' />"+
            "    <order attribute='starttime' descending='true' />"+
            "    <link-entity name='account' from='accountid' to='iroc_padid' link-type='outer' alias='pad'>"+
            "      <attribute name='iroc_foremangroup' />"+
            "      <attribute name='iroc_lastschedulevisitcompletedate' />"+
            "      <attribute name='iroc_tierid' />"+
            "    </link-entity>"+
            "    <link-entity name='bookingstatus' from='bookingstatusid' to='bookingstatus' link-type='inner' alias='bs'>"+
            "      <attribute name='description' />"+
            "      <attribute name='msdyn_fieldservicestatus' />"+
            "      <attribute name='bookingstatusid' />" +

            //// SCHEDULED ANY DATE //////
            "      <filter type='and'>"+
            "        <condition attribute='msdyn_fieldservicestatus' operator='eq' value='690970000'/>"+
            "      </filter>"+
            ////////////////////////////

            "    </link-entity>" +
            "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder' alias='wo'>"+
            "      <attribute name='msdyn_workordertype' />"+
            "      <attribute name='msdyn_serviceaccount' />"+
            "      <attribute name='msdyn_workorderid' />"+
            "      <link-entity name='msdyn_workordertype' from='msdyn_workordertypeid' to='msdyn_workordertype' alias='wot'>"+
            "        <attribute name='iroc_color' />"+
            "      </link-entity>"+
            "    </link-entity>"+
            "    <link-entity name='bookableresource' from='bookableresourceid' to='resource' alias='br'>"+
            "      <attribute name='iroc_irocresourcetype' />"+
            "      <attribute name='iroc_mbevisitownershipid' />"+
            "      <link-entity name='bookableresourcecategoryassn' from='resource' to='bookableresourceid'  link-type='outer' alias='brca'>" +
            " <attribute name='resourcecategory' />" +
            "        <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory' alias='brc'>"+
            "          <attribute name='description' />"+
            "          <attribute name='iroc_foremangroup' />"+
            "          <attribute name='iroc_foremanqueueid' />"+
            "        </link-entity>"+
            "      </link-entity>"+
            "    </link-entity>"+
            "  </entity>"+
            "</fetch>";
        //Completed last 3 days
        var fetchXmlComplete = "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false'>" +
            "  <entity name='bookableresourcebooking'>" +
            "    <attribute name='bookingstatus' />" +
            "    <attribute name='bookableresourcebookingid' />" +
            "    <attribute name='name' />" +
            "    <attribute name='starttime' />" +
            "    <attribute name='msdyn_workorder' />" +
            "    <attribute name='resource' />" +
            "    <attribute name='bookingstatus' />" +
            "    <attribute name='iroc_isinspectionrequired' />" +
            "    <attribute name='iroc_leaseinspectionid' />" +
            "    <attribute name='iroc_padid' />" +
            "    <attribute name='duration' />" +

            //// LAST THREE DAYS //////
            "    <filter type='and'>" +
            "      <condition attribute='starttime' operator='last-x-days' value='3'/>" +
            "    </filter>" +
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

            //// COMPLETED //////
            "      <filter type='and'>" +
            "        <condition attribute='msdyn_fieldservicestatus' operator='eq' value='690970004'/>" +
            "      </filter>" +
            /////////////////////////////

            "    </link-entity>" +
            "    <link-entity name='msdyn_workorder' from='msdyn_workorderid' to='msdyn_workorder' alias='wo'>" +
            "      <attribute name='msdyn_workordertype' />" +
            "      <attribute name='msdyn_serviceaccount' />" +
            "      <attribute name='msdyn_workorderid' />" +
            "      <link-entity name='msdyn_workordertype' from='msdyn_workordertypeid' to='msdyn_workordertype' alias='wot'>" +
            "        <attribute name='iroc_color' />" +
            "      </link-entity>" +
            "    </link-entity>" +
            "    <link-entity name='bookableresource' from='bookableresourceid' to='resource' alias='br'>" +
            "      <attribute name='iroc_irocresourcetype' />" +
            "      <attribute name='iroc_mbevisitownershipid' />" +
            "      <link-entity name='bookableresourcecategoryassn' from='resource' to='bookableresourceid' alias='brca'>" +
            " <attribute name='resourcecategory' />" +
            "        <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory'  link-type='outer'  alias='brc'>" +
            "          <attribute name='description' />" +
            "          <attribute name='iroc_foremangroup' />" +
            "          <attribute name='iroc_foremanqueueid' />" +
            "        </link-entity>" +
            "      </link-entity>" +
            "    </link-entity>" +
            "  </entity>" +
            "</fetch>";
        FS.BRBItemList = [];
        MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml, function (defaultbrbrecords) {
               // MobileCRM.bridge.alert("defaultbrbrecords " + defaultbrbrecords.length);
                for (var i in defaultbrbrecords) {
                    var brbrecords = defaultbrbrecords[i].properties;
                    //Create Array List of Objects
                    var newItem = new Object();
                   
                    newItem.BRBId = brbrecords.bookableresourcebookingid;;
                    newItem.BRBName = brbrecords["name"];;
                    newItem.PadName = brbrecords["iroc_padid"].primaryName;
                    newItem.PadId = brbrecords["iroc_padid"].id;
                    newItem.Color = brbrecords["wot.iroc_color"] === undefined ? "#fff" : brbrecords["wot.iroc_color"];
                    newItem.BookingStatusName = brbrecords["bookingstatus"].primaryName;
                    newItem.BookingStatusId = brbrecords["bookingstatus"].id;
                    newItem.LeaseRequired = brbrecords["iroc_isinspectionrequired"] === undefined ? false : brbrecords["iroc_isinspectionrequired"];
                    newItem.LeaseLink = brbrecords["iroc_leaseinspectionid"] === undefined ? i : brbrecords["iroc_leaseinspectionid"].id;
                    newItem.ForemanGroupName = "";
                    newItem.ForemanGroupPicklistValue = brbrecords["brc.iroc_foremangroup"] === undefined ? null : brbrecords["brc.iroc_foremangroup"];
                    newItem.ForemanGroupBRCId = "";
                    newItem.ResourceName = brbrecords["resource"] === undefined ? "" : brbrecords["resource"].primaryName;
                    newItem.ResourceId = brbrecords["resource"] === undefined ? "" : brbrecords["resource"].id;
                    newItem.ResourceCategory = brbrecords["brca.resourcecategory"] === undefined ? "" : brbrecords["brca.resourcecategory"].primaryName;
                    newItem.ResourceCategoryId = brbrecords["brca.resourcecategory"] === undefined ? "" : brbrecords["brca.resourcecategory"].id;
                    newItem.StartTime = brbrecords["starttime"] === undefined ? null : brbrecords["starttime"];
                    newItem.Duration = brbrecords["duration"] === undefined ? null : brbrecords["duration"];
                    newItem.Completed = false;
                  
                    FS.BRBItemList.push(newItem);
                }
                MobileCRM.FetchXml.Fetch.executeFromXML(
                    fetchXmlComplete, function (defaultbrbrecords) {
                       // MobileCRM.bridge.alert("defaultbrbrecords fetchXmlComplete " + defaultbrbrecords.length);
                        for (var i in defaultbrbrecords) {
                            var brbrecords = defaultbrbrecords[i].properties;
                            //Create Array List of Objects
                            var newItem = new Object();

                            newItem.BRBId = brbrecords.bookableresourcebookingid;;
                            newItem.BRBName = brbrecords["name"];;
                            newItem.PadName = brbrecords["iroc_padid"].primaryName;
                            newItem.PadId = brbrecords["iroc_padid"].id;
                            newItem.Color = brbrecords["wot.iroc_color"] === undefined ? "#fff" : brbrecords["wot.iroc_color"];
                            newItem.BookingStatusName = brbrecords["bookingstatus"].primaryName;
                            newItem.BookingStatusId = brbrecords["bookingstatus"].id;
                            newItem.LeaseRequired = brbrecords["iroc_isinspectionrequired"] === undefined ? false : brbrecords["iroc_isinspectionrequired"];
                            newItem.LeaseLink = brbrecords["iroc_leaseinspectionid"] === undefined ? i : brbrecords["iroc_leaseinspectionid"].id;
                            newItem.ForemanGroupName = "";
                            newItem.ForemanGroupPicklistValue = brbrecords["brc.iroc_foremangroup"] === undefined ? null : brbrecords["brc.iroc_foremangroup"];
                            newItem.ForemanGroupBRCId = "";
                            newItem.ResourceName = brbrecords["resource"] === undefined ? "" : brbrecords["resource"].primaryName;
                            newItem.ResourceId = brbrecords["resource"] === undefined ? "" : brbrecords["resource"].id;
                            newItem.ResourceCategory = brbrecords["brca.resourcecategory"] === undefined ? "" : brbrecords["brca.resourcecategory"].primaryName;
                            newItem.ResourceCategoryId = brbrecords["brca.resourcecategory"] === undefined ? "" : brbrecords["brca.resourcecategory"].id;
                            newItem.StartTime = brbrecords["starttime"] === undefined ? null : brbrecords["starttime"];
                            newItem.Duration = brbrecords["duration"] === undefined ? null : brbrecords["duration"];
                            newItem.Completed = true;

                            FS.BRBItemList.push(newItem);
                        }
                        FS.RouteBoard.loadResourceGroups();

                    }, function (error) {
                        MobileCRM.bridge.alert("Get BRBs1 Error: " + error);
                    }, null);
            }, function (error) {
                MobileCRM.bridge.alert("Get BRBs2 Error: " + error);
            }, null);
    },
    applyFilters: function (){
        debugger;
        var tempDayArray = FS.BRBItemList;

        //Filter to selected day
        var todayIs = FS.SelectedDate;
        var todayIsStart = new Date(todayIs.getFullYear(), todayIs.getMonth(), todayIs.getDate(), 00, 00, 00, 00);
        var todayIsEnd = new Date(todayIs.getFullYear(), todayIs.getMonth(), todayIs.getDate(), 23, 59, 59, 59);

        tempDayArray = $.grep(FS.BRBItemList, function (n, i) {
            return (n.StartTime >= todayIsStart && n.StartTime <= todayIsEnd
            );
        }, false);

        //MobileCRM.bridge.alert(" tempDayArray " + tempDayArray.length + " " + FS.SelectedDate);
       //Filter to Completed/Scheduled Toggle
        var tempScheduled = tempDayArray;
        var bScheduled = true;

        if (FS.SelectedToggle === "Completed") { bScheduled = false; }
        tempScheduled = $.grep(tempDayArray, function (n, i) {
            return (n.Completed != bScheduled
            );
        }, false);
        

         //Filter the BRB Array to just the selected foreman groups
        var tempForemanArray = tempScheduled;    
        if (FS.SelectedForemanGroups.length > 0) {
            tempForemanArray = jQuery.grep(tempScheduled, function (n, i) {
                for (var s = 0; s < FS.SelectedForemanGroups.length; s++) {
                    if (n.ForemanGroupPicklistValue.toString() === FS.SelectedForemanGroups[s]) {
                        return true;
                    }
                    if (s == (FS.SelectedForemanGroups.length -1)) {
                        return false;
                    }
                }
               
            });
        }
       
        //Filter to Resources
        var tempResources = tempForemanArray; 
        if (FS.SelectedResources.length > 0) {
            tempResources = jQuery.grep(tempForemanArray, function (n, i) {
                for (var s = 0; s < FS.SelectedResources.length; s++) {
                    if (n.ResourceId === FS.SelectedResources[s]) {
                        return true;
                    }
                    if (s == (FS.SelectedResources.length - 1)) {
                        return false;
                    }
                }

            });
        }


         //Filter to JobTypes
        var tempJoyTypes = tempResources; 



        FS.RouteBoard.buildTable(tempJoyTypes);
    },
    toggleFilter: function () {
        $('#toggle-event').change(function () {
            if ($(this).prop('checked')) {
                FS.SelectedToggle = "Completed"
            }
            else {
                FS.SelectedToggle = "Scheduled"
            }
            FS.RouteBoard.applyFilters();
        });
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

        FS.RouteBoard.applyFilters();
    },
    foremangroupFilter: function () {
        $('#foremangroupfilter').multiselect({
            buttonWidth: '150px',
            nonSelectedText: 'All Foreman Groups',
            includeSelectAllOption: true,
            onSelectAll: function () {
                //Clear all selected foremans
                FS.SelectedForemanGroups = [];
                FS.RouteBoard.rebuildResourceFilter();
            },
            onDeselectAll: function () {
                //Clear all selected formans
                FS.SelectedForemanGroups = [];
                FS.RouteBoard.rebuildResourceFilter();
            },
            onChange: function (option, checked, select) {
  //              alert('Changed foremangroupfilter option ' + $(option).val() + ' ' + checked);
                if (checked) {
                    FS.SelectedForemanGroups.push($(option).val());
                }
                else {
                   for (var i = 0; i < FS.SelectedForemanGroups.length; i++) {
                        if (FS.SelectedForemanGroups[i] === $(option).val()) {
                            FS.SelectedForemanGroups.splice(i, 1);
                        }
                    }
                }
                FS.RouteBoard.rebuildResourceFilter();
             
            }
        });
       
   },
    rebuildResourceFilter: function () {

        //For each selected foreman group, get the unique resource for them an rebuild the dropdown.
        FS.SelectedResources = [];
        var options = [];
        //Get just the unique resources as the array can return the same person more than once if they are in multiple ForemanGroups
        if (FS.SelectedForemanGroups.length > 0) {
            var filteredResourceArray = jQuery.grep(FS.AllResources, function (n, i) {
                for (var s = 0; s < FS.SelectedForemanGroups.length; s++) {
                    if (n.BRCForemanPicklist.toString() === FS.SelectedForemanGroups[s]) {
                        return true;
                    }
                    if (s == FS.SelectedForemanGroups.length - 1) { return false; }
                }
            });
            for (var j = 0; j < filteredResourceArray.length; j++) {
                // resourceListGroup.options[j] = new Option(filteredResourceArray[j].BRName, filteredResourceArray[j].BRId);
                var optionItem = new Object();
                optionItem.label = filteredResourceArray[j].BRName;
                optionItem.title = filteredResourceArray[j].BRName;
                optionItem.value = filteredResourceArray[j].BRId;

                options.push(optionItem)
            }
        }
        else {
            //AllResourcesUniqueBR
            for (var j = 0; j < FS.AllResourcesUniqueBR.length; j++) {
                //  resourceListGroup.options[j] = new Option(FS.AllResourcesUniqueBR[j].BRName, FS.AllResourcesUniqueBR[j].BRId);
                var optionItem = new Object();
                optionItem.label = FS.AllResourcesUniqueBR[j].BRName;
                optionItem.title = FS.AllResourcesUniqueBR[j].BRName;
                optionItem.value = FS.AllResourcesUniqueBR[j].BRId;

                options.push(optionItem)
            }
        }

        //Sort options
        options.sort(FS.RouteBoard.SortByLabel);

        $('#resourcefilter').multiselect('setOptions', resourcefilterConfigurationSet);
        $('#resourcefilter').multiselect('dataprovider', options);
       

        FS.RouteBoard.applyFilters();
    },
    //Sort the options
    SortByLabel: function (a, b) {
        var aName = a.label.toLowerCase();
        var bName = b.label.toLowerCase();
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },

    loadForemanGroup: function (foremanList) {

        FS.AllForemanGroups = [];

        var foremanListGroup = document.getElementById('foremangroupfilter');

        for (var i = 0; i < foremanList.length; i++) {
         
            var recordUser = foremanList[i].User == undefined ? "" : foremanList[i].User.id;
            var bSelected =  false;

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
        }
        FS.RouteBoard.foremangroupFilter();
        if (FS.SelectedForemanGroups.length > 0 && !FS.FirstTimeLoad) {
            FS.RouteBoard.rebuildResourceFilter();
        }
        FS.FirstTimeLoad = false;
        FS.RouteBoard.applyFilters();

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
            iroc_irocresourcetype4: "929530003"
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
            "      <condition attribute='statecode' operator='eq' value='", fetchData.statecode/*0*/, "'/>",
            "      <filter type='or'>",
            "        <condition attribute='iroc_irocresourcetype' operator='eq' value='", fetchData.iroc_irocresourcetype/*929530002*/, "'/>",
            "        <condition attribute='iroc_irocresourcetype' operator='eq' value='", fetchData.iroc_irocresourcetype2/*929530001*/, "'/>",
            "        <condition attribute='iroc_irocresourcetype' operator='eq' value='", fetchData.iroc_irocresourcetype3/*929530000*/, "'/>",
            "        <condition attribute='iroc_irocresourcetype' operator='eq' value='", fetchData.iroc_irocresourcetype4/*929530003*/, "'/>",
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

        MobileCRM.FetchXml.Fetch.executeFromXML(
            resourceFetchXML, function (resourceList) {
                //  MobileCRM.bridge.alert("Resource Filter " + resourceList.length);
                FS.AllRouteOperators = [];
                FS.thisUserForemans = [];
                FS.thisUserForemanQueues = [];
                var thisUserRoutes = [];
                FS.AllResources = [];
                for (var i = 0; i < resourceList.length; i++) {
                    var name = resourceList[i]['name'];
                    var user = resourceList[i]['tm.systemuserid'] === undefined ? null : resourceList[i]['tm.systemuserid'];
                    if (user == null) { user = resourceList[i]['userid'] === undefined ? null : resourceList[i]['userid']; }
                    var team = resourceList[i]['t.teamid'] === undefined ? null : resourceList[i]['t.teamid'];
                    var routeOperators = resourceList[i]['tm.systemuserid'] === undefined ? null : resourceList[i]['tm.systemuserid'];
                    var saveResource = new Object();
                    saveResource.BRId = resourceList[i]['bookableresourceid'];
                    saveResource.BRName = name;
                    saveResource.BRType = resourceList[i]['iroc_irocresourcetype'];
                    saveResource.BRCForemanId = resourceList[i]['brc.bookableresourcecategoryid'];
                    saveResource.BRCQueueId = resourceList[i]['brc.iroc_foremanqueueid'] === undefined ? null : resourceList[i]['brc.iroc_foremanqueueid'];
                    saveResource.User = user;
                    saveResource.Team = team;
                    saveResource.BRCForemanPicklist = resourceList[i]['brc.iroc_foremangroup'] === undefined ? null : resourceList[i]['brc.iroc_foremangroup'];;
                    saveResource.BRCForemanName = resourceList[i]['brc.name'];
                    FS.AllResources.push(saveResource);
                    if (routeOperators !== null) {
                        var saveRouteOperators = new Object();
                        saveRouteOperators.RouteName = name;
                        saveRouteOperators.RouteBRId = resourceList[i]['bookableresourceid'];
                        saveRouteOperators.RouteBRCForemanId = resourceList[i]['brc.bookableresourcecategoryid'];
                        saveRouteOperators.RouteBRCQueueId = resourceList[i]['brc.iroc_foremanqueueid'] === undefined ? null : resourceList[i]['brc.iroc_foremanqueueid'];
                        saveRouteOperators.RouteUser = routeOperators;
                        FS.AllRouteOperators.push(saveRouteOperators);
                        if (routeOperators.id == FS.CurrentUser) {
                            thisUserRoutes.push(resourceList[i]['bookableresourceid'])
                        }
                    }
                    if (user != null && user.id == FS.CurrentUser) {
                        FS.thisUserForemans.push(resourceList[i]['brc.bookableresourcecategoryid']);
                        FS.thisUserForemanQueues.push(resourceList[i]['brc.iroc_foremanqueueid'] === undefined ? null : resourceList[i]['brc.iroc_foremanqueueid']);
                    }
                }
                //Get just the unique resources as the array can return the same person more than once if they are in multiple ForemanGroups

                //    MobileCRM.bridge.alert(" AllResources: " + FS.AllResources.length);
                debugger;
                //Load the foremans from this dataset
                FS.AllResourcesUniqueForemans = [];
                var uniqueForemans = [];
                for (var k = 0; k < FS.AllResources.length; k++) {
                    var value = FS.AllResources[k];
                    if (uniqueForemans.includes(value.BRCForemanId)) {
                        //nothing
                    } else {
                        FS.AllResourcesUniqueForemans.push(value);
                        uniqueForemans.push(value.BRCForemanId);
                    }
                }
                //  MobileCRM.bridge.alert("Resource Filter uniqueResources: " + FS.AllResourcesUniqueForemans.length);

               

                //Load all unique Bookable Resources
                var uniqueResources = [];
                FS.AllResourcesUniqueBR = [];
                for (var k = 0; k < FS.AllResources.length; k++) {
                    var value = FS.AllResources[k];
                    if (uniqueResources.includes(value.BRId)) {
                        //nothing
                    } else {
                        FS.AllResourcesUniqueBR.push(value);
                        uniqueResources.push(value.BRId);
                    }
                }

                //uniqueResources.filter((value, index, self) => self.map(x => x.BRId).indexOf(value.BRId) == index);
                //  MobileCRM.bridge.alert("Resource Filter uniqueResources: " + FS.AllResourcesUniqueBR.length);


                var options = [];

                for (var j = 0; j < FS.AllResourcesUniqueBR.length; j++) {
                    //Autoselect current user 
                    var recordUser = FS.AllResourcesUniqueBR[j].User == undefined ? "" : FS.AllResourcesUniqueBR[j].User.id;
                    var bSelected = recordUser === FS.CurrentUser ? true : false;

                    //Is this person on any routes that need to be autoselected too?
                    if (thisUserRoutes.includes(FS.AllResourcesUniqueBR[j].BRId)) {
                        bSelected = true;
                    }
                    var optionItem = new Object();
                    optionItem.label = FS.AllResourcesUniqueBR[j].BRName;
                    optionItem.title = FS.AllResourcesUniqueBR[j].BRName;
                    optionItem.value = FS.AllResourcesUniqueBR[j].BRId;
                    optionItem.selected = bSelected;
                    options.push(optionItem)
                    //   resourceListGroup.options[j] = new Option(FS.AllResourcesUniqueBR[j].BRName, FS.AllResourcesUniqueBR[j].BRId, bSelected);
                    if (bSelected) {
                        //    resourceListGroup.options[j].selected = true;
                        FS.SelectedResources.push(FS.AllResourcesUniqueBR[j].BRId);
                    }
                }
                $('#resourcefilter').multiselect('setOptions', resourcefilterConfigurationSet);
                $('#resourcefilter').multiselect('dataprovider', options);
               

                //Load the foreman groups - we do this after resources so we have the users resources set so we can autoselect foreman groups too
                FS.RouteBoard.loadForemanGroup(FS.AllResourcesUniqueForemans);


            }, function (error) {
                MobileCRM.bridge.alert("Resource Filter Error: " + error);
            }, null)
    },

    addZero: function (num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    },
    
    onbrbRowClick: function (e) {
      //  if (btnclicked == false) {
            var dataitem = e.id;
            MobileCRM.UI.FormManager.showDetailDialog("bookableresourcebooking", dataitem, null);
      //  }
      //  else {
      //      btnclicked = false;
      //  }
    },
    onLeaseClick: function (e) {
            var dataitem = e.id;
            MobileCRM.UI.FormManager.showDetailDialog("iroc_leaseinspection", dataitem, null);
    },
    onCreateRouteFeedClick: function (e) {
        //Get the BRB from the Array
       
        var result = FS.BRBItemList.find(obj => {
            return obj.BRBId === e.id
        });
       
    //    MobileCRM.bridge.alert(" result " + result);
        var padid = new MobileCRM.Reference("account", result.PadId, result.PadName);
        var bookingid = new MobileCRM.Reference("bookableresourcebooking", e.id);
        var relationShip = new MobileCRM.Relationship("iroc_bookingid", bookingid, null, null);
        MobileCRM.UI.FormManager.showNewDialog("iroc_routefeed", relationShip, {
            "@initialize": {
                iroc_padid: padid
            }
        }, null);
       // btnclicked = true;
    },

    onAssignBtnClick: function (e) {
        brbRecordId = e.id;
        document.getElementById("optionset").style.display = "none";
        document.getElementById("brblist").style.display = "none";
        document.getElementById("assign").style.display = "block";
        document.getElementById("reasons").style.display = "none";
        FS.RouteBoard.loadBRGroup();
    },

    loadBRGroup: function () {

        //TO-DO:  Replace this with Global array - no need to requery database.
        var brGroupFetchXML = "<fetch version='1.0' resultformat='JSON' mapping='logical'>" +
            "<entity name='bookableresource'>" +
            "<attribute name='name' />" +
            "<attribute name='createdon' />" +
            "<attribute name='resourcetype' />" +
            "<attribute name='bookableresourceid' />" +
            "<order attribute='name' descending='false' />" +
            "<filter type='and'>" +
            "<condition attribute='statecode' operator='eq' value='0' />"+
            "</filter>" +
            "    <order attribute='resourcetype' />" +
             "    <order attribute='name' />" +
            "</entity>" +
            "</fetch>";

        MobileCRM.FetchXml.Fetch.executeFromXML(
            brGroupFetchXML, function (brgrouplist) {
                var brListGroup = document.getElementById('foremangroupqueuefilter');
                brListGroup.options[0] = new Option(' ', '-1');
                var bSelected = false;
                for (var i = 0; i < brgrouplist.length; i++) {
                    var picklistValue = brgrouplist[i].bookableresourceid;
                    var name = brgrouplist[i].name;
                    brListGroup.options[i + 1] = new Option(name, picklistValue);
                     //Set to the default Foreman Group queue.  THe user may belong to more than oe foreman group so it would select the first one.
                    if (!bSelected) {
                        if (FS.thisUserForemanQueues.includes(picklistValue)) {
                            bSelected = true;
                            brListGroup.options[i + 1].selected = true;
                        }
                    }
                }
            }, function (error) {
                MobileCRM.bridge.alert("loadBRGroup Error: " + error);
            }, null)
    },

    setResource: function (bookableresourcebooking) {
        var selectedOption = document.getElementById("foremangroupqueuefilter");
        var bookableresourceText = selectedOption.options[selectedOption.selectedIndex].text;
        var bookableresourceId = selectedOption.options[selectedOption.selectedIndex].value;
        var resource = new MobileCRM.Reference("bookableresource", bookableresourceId, bookableresourceText);
        bookableresourcebooking.properties["resource"] = resource;
        bookableresourcebooking.save(FS.RouteBoard.callBack);
    },

    callBack: function (error) {
        if (error) {
            MobileCRM.bridge.alert("An error occurred: " + error);
        }
        else {
            MobileCRM.bridge.alert("Successfully saved");
            FS.RouteBoard.onloadFunction();
           
        }
    },

    onAssign: function () {
        MobileCRM.DynamicEntity.loadById("bookableresourcebooking", brbRecordId,
            FS.RouteBoard.setResource,
            function (error) {
                MobileCRM.bridge.alert("An error occurred: " + error);
            },
            null);
    },

    onClose: function () {
        FS.RouteBoard.displayRule();
        //No need to reload when the cancel action.
       // FS.RouteBoard.onloadFunction();
    },

    onReasonBtnClick: function (e) {
        brbRecordId = e.id;
        document.getElementById("optionset").style.display = "none";
        document.getElementById("brblist").style.display = "none";
        document.getElementById("assign").style.display = "none";
        document.getElementById("reasons").style.display = "block";
        FS.RouteBoard.loadReasons();
    },
    loadJobTypes: function () {
        $('#jobfilter').multiselect({
            buttonWidth: '150px',
            nonSelectedText: 'All Job Types',
            includeSelectAllOption: true
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
                $('#jobfilter').multiselect('dataprovider', options);
            },
            MobileCRM.bridge.alert,
            null
        );
    },
    loadReasons: function () {
        MobileCRM.Metadata.getOptionSetValues(
            "bookableresourcebooking",
            "iroc_missedreason",
            function (optionSetValues) {
                var reason = document.getElementById('reason');
                reason.options[0] = new Option(' ', '-1');
                var i = 0;
                for (name in optionSetValues) {
                    var val = optionSetValues[name];
                    reason.options[i + 1] = new Option(name, val);
                    i = i + 1;
                }
            },
            MobileCRM.bridge.alert,
            null
        );
    },
    // Get formatted date YYYY-MM-DD
    getFormattedDate: function (date) {
        return date.getFullYear()
            + "-"
            + ("0" + (date.getMonth() + 1)).slice(-2)
            + "-"
            + ("0" + date.getDate()).slice(-2);
    },
    today: function () {
        return new Date();
    },

    onSave: function () {
        MobileCRM.DynamicEntity.loadById("bookableresourcebooking", brbRecordId,
            FS.RouteBoard.SaveReason,
            function (error) {
                MobileCRM.bridge.alert("An error occurred: " + error);
            },
            null);
    },

    SaveReason: function (bookableresourcebooking) {
        var selectedOption = document.getElementById("reason");
     //   var reasonText = selectedOption.options[selectedOption.selectedIndex].text;
        var reasonValue = selectedOption.options[selectedOption.selectedIndex].value;
        bookableresourcebooking.properties["iroc_missedreason"] = reasonValue;
        var entity = new MobileCRM.FetchXml.Entity("bookingstatus");
        entity.addAttributes("name");
        entity.addAttributes("bookstatusid");
        var filter = new MobileCRM.FetchXml.Filter();
        filter.where("name", "eq", missedStatus);
        entity.filter = filter;
        var fetch = new MobileCRM.FetchXml.Fetch(entity);
        var bookingid;
        var bookingname;
        fetch.execute(
            "Array",
            function (result) {
                if (result.length == 0) { MobileCRM.bridge.alert("ERROR - Could not find booking status named " + missedStatus); }
                else {
                    for (var i in result) {
                        var bookingstatus = result[i];
                        bookingid = bookingstatus[0];
                        bookingname = bookingstatus[5];
                    }
                    status = new MobileCRM.Reference("bookingstatus", bookingid, bookingname);
                    bookableresourcebooking.properties["bookingstatus"] = status;
                    bookableresourcebooking.save(FS.RouteBoard.callBack);
                }
            },
            function (err) {
                MobileCRM.bridge.alert("Error fetching accounts: " + err);
            },
            null
        );
    },
    createNewJob: function(e){
        MobileCRM.UI.FormManager.showNewDialog("iroc_jobtransaction", {  "@initialize": {
        }}, null); 
    }
}
