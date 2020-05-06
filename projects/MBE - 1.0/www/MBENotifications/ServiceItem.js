// <reference path="jsbridge.js" />
var FS = FS || {};
FS.TableItemList = [];
FS.AllForemanGroups = [];
FS.SelectedForemanGroups = -1;
FS.CurrentUser = "";
FS.CurrentUserForemans = [];
FS.IsOnLine = false;
FS.SelectedToggle = false;
FS.ServiceItemTypes = [];
FS.ServiceItem = {
    onloadFunction: function () {
        //Who is the current user?
        document.getElementById("loader").style.display = "block";
       
        MobileCRM.Configuration.requestObject(
            function (config) {
                if (config.IsOnLine) {
                    FS.IsOnLine = true;
                }
                else {
                    FS.IsOnLine = false;
                }
                var settings = config.settings;
                FS.CurrentUser = settings.systemUserId;
                FS.ServiceItem.getTypes();
                return false;
            },
            function (err) {
                /// <param name="err" type="String">/<param>
                MobileCRM.bridge.alert("An error occurred: " + err);
            },
            null
        );
    },
    buildTable: function (itemArray) {
        /*
         *  newItem.Type = thisRecord["iroc_serviceitemtype"] == undefined ? "" : thisRecord["iroc_serviceitemtype"];
                    newItem.LinkId = thisRecord["accountid"];
                    newItem.Title = thisRecord["name"] == undefined ? "unknown" : thisRecord["name"];
                    newItem.Pad = thisRecord["iroc_irocpadidentfier"] == undefined ? "" : thisRecord["iroc_irocpadidentfier"];
                    newItem.Route = thisRecord["ownerid"] == undefined ? "" : thisRecord["ownerid"].primaryName;
                    newItem.ForemanGroup
         */
        var sortedArraybyTitle = itemArray;
        sortedArraybyTitle = sortedArraybyTitle.sort(function (a, b) {
            var aName = a.Title.toLowerCase();
            var bName = b.Title.toLowerCase();
            return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
        })
        var table = document.getElementById("tablelist");
        table.tBodies[0].innerHTML = "";
        var tableRows = "";
        var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        for (var i in sortedArraybyTitle) {
            var currentRecord = sortedArraybyTitle[i];
  

            let obj = FS.ServiceItemTypes.find(obj => obj.id == currentRecord.Type);
            var serviceItemType = obj.name;
           
            tableRows = tableRows +
                //Row 1, 3 columns
                "<tr onclick='FS.ServiceItem.onClickOpen(this)' id='" + currentRecord.LinkId + "'>" +
                "<td rowspan='2' class='irocNotificationMonth'>" + currentRecord.Pad + "</td>" +
                "<td class='irocTitle'>" /*+ serviceItemType +": " */+ currentRecord.Title + "</td>" +   
                "</tr>" +
                  //Row 2
                "<tr onclick='FS.ServiceItem.onClickOpen(this)' id='" + currentRecord.LinkId + "'>" +             
                "<td class='irocBody irocTableLastRow'>" + " " /*+  currentRecord.Route*/ +"<br />" + "</td>" +    
                "</tr>";
        }
        table.tBodies[0].innerHTML += tableRows;
        
        document.getElementById("loader").style.display = "none";
        if (itemArray.length == 0) {
            $("#noRecords").show();
        }
        else {
            $("#noRecords").hide();
        }
        var numberRecords = "# of Service Items: " + itemArray.length.toString();
        $('.counter').html(numberRecords);
    },
    addZero: function (num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    },
    onClickOpen: function (e) {
        var dataitem = e.id;
        MobileCRM.UI.FormManager.showDetailDialog("account", dataitem, null);
    },
    SortByTitle: function (a, b) {
        var aName = a.Title.toLowerCase();
        var bName = b.Title.toLowerCase();
        return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
    },
    getTypes: function () {
        FS.ServiceItemTypes = [];
        MobileCRM.Metadata.getOptionSetValues(
            "account",
            "iroc_serviceitemtype",
            function (optionSetValues) {
           
               // MobileCRM.bridge.alert("iroc_category");
                for (name in optionSetValues) {
                    var val = optionSetValues[name];
                    var newItem = new Object();
                    newItem.id = val;
                    newItem.name = name;
                    FS.ServiceItemTypes.push(newItem);
                }
                //Now that we have the Foreman groups, we get all SFs
                FS.ServiceItem.getUserForemans();
            },
            function (error) { MobileCRM.bridge.alert("did not find optionset iroc_category"); },
            null
        );
    },
    getUserForemans: function () {
        var fetchData = {
            userid: FS.CurrentUser
        };
        var fetchXml = [
            "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' distinct='true'>",
            "  <entity name='bookableresourcecategoryassn'>",
            "    <link-entity name='bookableresource' from='bookableresourceid' to='resource' alias='br'>",
            "      <attribute name='name' />",
            "      <filter>",
            "        <condition attribute='userid' operator='eq' value='", fetchData.userid, "'/>",
            "      </filter>",
            "    </link-entity>",
            "    <link-entity name='bookableresourcecategory' from='bookableresourcecategoryid' to='resourcecategory' alias='brc'>",
            "      <attribute name='name' />",
            "      <attribute name='iroc_foremangroup' />",
            "    </link-entity>",
            "  </entity>",
            "</fetch>",
        ].join("");
        FS.CurrentUserForemans = [];
        MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml, function (userForemans) {
                for (var i in userForemans) {
                    var currentRecord = userForemans[i].properties;
                    FS.CurrentUserForemans.push(currentRecord["brc.iroc_foremangroup"]);

                }

                //Now that we have the users Foremans, we can retrieve all Foremans.
                FS.ServiceItem.getForeman();

            }, function (error) {
                document.getElementById("loader").style.display = "none";
                MobileCRM.bridge.alert("Get Foreman Error: " + error);
            }, null);

    },

    getForeman: function () {
        FS.AllForemanGroups = [];
     
        MobileCRM.Metadata.getOptionSetValues(
            "account",
            "iroc_foremangroup",
            function (optionSetValues) {
                var selected = false;
                var foremanListGroup = document.getElementById('foremangroupfilter');
              
                var optNumber = -1;
                               
               // MobileCRM.bridge.alert("iroc_foremangroup");
                for (name in optionSetValues) {
                    var val = optionSetValues[name];
                    var newItem = new Object();
                    newItem.ForemanID = val;
                    newItem.ForemanName = name;
                    FS.AllForemanGroups.push(newItem);
                    optNumber++;
                    foremanListGroup.options[optNumber] = new Option(name, val);
                    if (FS.CurrentUserForemans.length > 0 && !selected) {
                        for (var s = 0; s < FS.CurrentUserForemans.length; s++) {
                           if (FS.CurrentUserForemans[s].toString() == val.toString()) {
                                selected = true;
                                foremanListGroup.options[optNumber].selected = true;
                                FS.SelectedForemanGroups = val;
                            }
                        }
                    }
                }
                //Now that we have the Foreman groups, we get all SFs
                FS.ServiceItem.getAllServiceItems();
            },
            function (error) { MobileCRM.bridge.alert("did not find optionset"); },
            null
        );
    },
    getAllServiceItems: function () {
        var fetchData = {
            statecode: "0"
        };
        var fetchXml = [
            "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' disctinct='true'>",
            "  <entity name='account'>",
            "    <attribute name='iroc_serviceitemtype' />",
            "    <attribute name='iroc_foremangroup' />",
            "    <attribute name='iroc_irocpadidentfier' />",
            "    <attribute name='name' />",
            "    <attribute name='ownerid' />",
            "    <attribute name='accountid' />",
            "    <filter type='and'>",
            "      <condition attribute='statecode' operator='eq' value='", fetchData.statecode/*0*/, "'/>",
            "      <condition attribute='iroc_serviceitemtype' operator='not-null' />",
            "      <condition attribute='iroc_foremangroup' operator='not-null' />",
            "    </filter>",
            "  </entity>",
            "</fetch>",
        ].join("");

        FS.TableItemList = [];
        MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml, function (ServiceItemRecords) {
                for (var i in ServiceItemRecords) {
                    var thisRecord = ServiceItemRecords[i].properties;
                    //Create Array List of Objects
                    var newItem = new Object();
                    newItem.Type = thisRecord["iroc_serviceitemtype"] == undefined || thisRecord["iroc_serviceitemtype"] == null ? "" : thisRecord["iroc_serviceitemtype"];
                    newItem.LinkId = thisRecord["accountid"];
                    newItem.Title = thisRecord["name"] == undefined || thisRecord["name"] == null ? "unknown" : thisRecord["name"];
                    newItem.Pad = thisRecord["iroc_irocpadidentfier"] == undefined || thisRecord["iroc_irocpadidentfier"] == null  ? "" : thisRecord["iroc_irocpadidentfier"];
                    newItem.Route = thisRecord["ownerid"] == undefined ? "" : thisRecord["ownerid"].primaryName;
                    newItem.ForemanGroup = thisRecord["iroc_foremangroup"] == undefined || thisRecord["iroc_foremangroup"] == null ? "" : thisRecord["iroc_foremangroup"];
                    FS.TableItemList.push(newItem);
                }
               // MobileCRM.bridge.alert("got records " + FS.TableItemList.length.toString());
                FS.ServiceItem.applyFilters();
            }, function (error) {
                document.getElementById("loader").style.display = "none";
                MobileCRM.bridge.alert("Get SI Error: " + error);
            }, null);
    },
    applyFilters() {
        //Filter to Expired/current Toggle
        var tempInitial = FS.TableItemList;

        //Filter the Array to just the selected foreman groups
        var tempForemanArray = tempInitial;
        if (FS.SelectedForemanGroups.toString() != "-1") {
            tempForemanArray = jQuery.grep(tempInitial, function (n, i) {
                if (n.ForemanGroup != null && (n.ForemanGroup.toString() === FS.SelectedForemanGroups.toString())) {
                    return true;
                }
                return false;
            });
        }
        FS.ServiceItem.buildTable(tempForemanArray);
    },
    onchange: function () {
        var e = document.getElementById("foremangroupfilter");
        var value = e.options[e.selectedIndex].value;
        FS.SelectedForemanGroups = value.toString();
        FS.ServiceItem.applyFilters();
    },
};
