// <reference path="jsbridge.js" />
var FS = FS || {};
FS.RFItemList = [];
FS.AllForemanGroups = [];
FS.CurrentUser = "";
FS.CurrentUserForemans = [];
FS.SelectedForemanGroups = "-1";
FS.IsOnLine = false;
FS.btnclicked = false;
FS.RouteFeed = {
    onloadFunction: function () {
        //Who is the current user?
        document.getElementById("loader").style.display = "block";
        document.getElementById("optionset").style.display = "block";
        document.getElementById("rflist").style.display = "block";
        document.getElementById("loadImage").style.display = "none";
        document.getElementById("btnClose").style.display = "none";
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
                FS.RouteFeed.getUserForemans();
                return false;
            },
            function (err) {
                /// <param name="err" type="String">/<param>
                MobileCRM.bridge.alert("An error occurred: " + err);
            },
            null
        );
    },

    onClose: function () {
        document.getElementById("optionset").style.display = "block";
        document.getElementById("rflist").style.display = "block";
        document.getElementById("loadImage").style.display = "none";
        document.getElementById("btnClose").style.display = "none";
        FS.btnclicked = false;
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
                FS.RouteFeed.getForeman();
            }, function (error) {
                document.getElementById("loader").style.display = "none";
                MobileCRM.bridge.alert("Get Foreman Error: " + error);
            }, null);
    },

    buildTable: function (itemArray) {
        var table = document.getElementById("rftablelist");
        table.tBodies[0].innerHTML = "";
        var tableRows = "";
        var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        //if (FS.IsOnLine) {
        //    tableRows = tableRows +
        //        "<tr><td colspan='3'>YOU ARE ONLINE ONLINE ONLINE</td></td>";
        //}
        //else {
        //    tableRows = tableRows +
        //        "<tr><td colspan='3'>YOU ARE OFFLINE</td></td>";
        //}
        for (var i in itemArray) {
            var currentRecord = itemArray[i];
            //Create the Day and Time
            var adjustHours = currentRecord.CreatedOn.getHours() > 12 ? currentRecord.CreatedOn.getHours() - 12 : currentRecord.CreatedOn.getHours();
            var displayTime = [[adjustHours,
                FS.RouteFeed.addZero(currentRecord.CreatedOn.getMinutes())].join(":")];
            var addon = "AM";
            addon = currentRecord.CreatedOn.getHours() >= 12 ? "PM" : "AM";
            if (currentRecord.AnnotationId == undefined || currentRecord.AnnotationId == "") {
                currentRecord.AnnotationId = null;
            }
            tableRows = tableRows +
                //Row 1, 3 columns
                "<tr onclick='FS.RouteFeed.onClickOpen(this)' id='" + currentRecord.RFId + "'>" +
                "<td rowspan='3' class='irocMonth'>" + months[currentRecord.CreatedOn.getMonth()] + "<br/>" + FS.RouteFeed.addZero(currentRecord.CreatedOn.getDate()) + "</td>" +
                "<td class='irocTitle'>" + currentRecord.RFName + "</td>" +
                "<td rowspan='2' class='irocIcon'><img id=" + currentRecord.AnnotationId + " style='height: 25px; visibility: " + currentRecord.Attachment + "' src='paperclip.svg' onclick='FS.RouteFeed.loadAttachment(this)'></td>" +
                "</tr>" +
                //Row 2
                "<tr onclick='FS.RouteFeed.onClickOpen(this)' id='" + currentRecord.RFId + "'>" +
                "<td class='irocBody'>" + currentRecord.CompletedBy + " @ " + displayTime + " " + addon + "</td>" +

                "</tr>" +
                //Row 3
                "<tr onclick='FS.RouteFeed.onClickOpen(this)' id='" + currentRecord.RFId + "'>" +
                "<td class='irocBody irocTableLastRow'>" + currentRecord.RFNote + "</td>" +
                "<td class='irocIconBottom'><img style='height: 25px; visibility: " + currentRecord.Post + "' src='posts.svg'></td>" +
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
        var numberRecords = "# of Route Feeds: " + itemArray.length.toString();
        $('.counter').html(numberRecords);
    },

    loadAttachment: function (noteid) {
        var imgElement = document.getElementById("img-result");
        MobileCRM.bridge.enableZoom(true);
        imgElement.setAttribute("src", "//:0");
        if (noteid.id != null) {
            document.getElementById("loader").style.display = "block";
            document.getElementById("optionset").style.display = "none";
            document.getElementById("rflist").style.display = "none";
            document.getElementById("loadImage").style.display = "block";
            document.getElementById("btnClose").style.display = "block";
            MobileCRM.DynamicEntity.loadDocumentBody("annotation", noteid.id, function (base64str)
            {
                if (imgElement)
                {
                    if (base64str != "undefined" || base64str != null || base64str != "") {
                        imgElement.setAttribute("src", "data:image/jpeg;base64," + base64str); // set the "src" attribute for out <img> element
                        document.getElementById("loader").style.display = "none";
                    }
                    else {
                        MobileCRM.bridge.alert("Image not available, kinldy sync again and try.");
                        document.getElementById("loader").style.display = "none";
                        document.getElementById("optionset").style.display = "block";
                        document.getElementById("rflist").style.display = "block";
                        document.getElementById("loadImage").style.display = "none";
                        document.getElementById("btnClose").style.display = "none";
                        FS.btnclicked = false;
                    }
                }
            }, function (err)
            {
                    if (err == "Not found") {
                        MobileCRM.bridge.alert("File is not an image or does not exist. If a video, please open Route Feed to view.");
                        document.getElementById("loader").style.display = "none";
                        document.getElementById("optionset").style.display = "block";
                        document.getElementById("rflist").style.display = "block";
                        document.getElementById("loadImage").style.display = "none";
                        document.getElementById("btnClose").style.display = "none";
                        FS.btnclicked = false;
                    }
                    else {
                        MobileCRM.bridge.alert("error");
                    }
                        document.getElementById("loader").style.display = "none";                    
            }
                , null);
            FS.btnclicked = true;
        }
        else {
            document.getElementById("optionset").style.display = "block";
            document.getElementById("rflist").style.display = "block";
            document.getElementById("loadImage").style.display = "none";
            document.getElementById("btnClose").style.display = "none";
            FS.btnclicked = false;
        }
    },

    addZero: function (num) {
        return (num >= 0 && num < 10) ? "0" + num : num + "";
    },

    getForeman: function () {
        var fetchForemanXML = "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false' disctinct='true'>" +
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
            fetchForemanXML, function (defaultForeman) {
                var selected = false;
                for (var i in defaultForeman) {
                    var foremanrecords = defaultForeman[i].properties;
                    var newItem = new Object();
                    newItem.ForemanID = foremanrecords["iroc_foremangroup"];
                    newItem.ForemanName = foremanrecords["name"];
                    FS.AllForemanGroups.push(newItem);
                }

                var foremanListGroup = document.getElementById('foremangroupfilter');
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
                            if (FS.CurrentUserForemans[s].toString() == picklistValue.toString()) {
                                selected = true;
                                foremanListGroup.options[optNumber].selected = true;
                                FS.SelectedForemanGroups = picklistValue;
                            }
                        }
                    }
                }
                //Now that we have the Foreman groups, we get all RFs
                FS.RouteFeed.getAllRouteFeeds();

            }, function (error) {
                document.getElementById("loader").style.display = "none";
                MobileCRM.bridge.alert("Get Foreman Error: " + error);
            }, null);
    },

    //Bryan - this is the onclick that opens the form
    onClickOpen: function (e) {
        if (FS.btnclicked == false) {
            var dataitem = e.id;
            MobileCRM.UI.FormManager.showDetailDialog("iroc_routefeed", dataitem, null);
        }
        else { FS.btnclicked = true; }
    },

    getAllRouteFeeds: function () {
        var fetchData = {
            createdon: "60"
        };
        var fetchXml = [
            "<fetch resultformat='DynamicEntities' version='1.0' aggregate='false'>",
            "<entity name='iroc_routefeed' >",
            "<attribute name='iroc_routefeedid' />",
            "<attribute name='createdby' />",
            "<attribute name='createdon' />",
            "<attribute name='iroc_bookingid' />",
            "<attribute name='iroc_notes' />",
            "<attribute name='iroc_name' />",
            "<order attribute='createdon' descending='true' />",
            "<link-entity name='annotation' from='objectid' to='iroc_routefeedid' link-type='outer' alias='notes' >",
            "<attribute name='annotationid' />",
            "<attribute name='isdocument' />",
            "<filter type='and'>",
            "<condition attribute='isdocument' operator='eq' value='1' />",
            "</filter>",
            "</link-entity>",
            "<link-entity name='account' from='accountid' to='iroc_padid' link-type='inner' alias='pad' >",
            "<attribute name='iroc_foremangroup' />",
            "<filter type='and'>",
            "<condition attribute='createdon' operator='last-x-days' value='", fetchData.createdon, "' />",
            "</filter>",
            "</link-entity>",
            "<link-entity name='bookableresourcebooking' from='bookableresourcebookingid' to='iroc_bookingid' link-type='inner' alias='brb' >",
            "<attribute name='name' />",
            "</link-entity>",
            "<link-entity name='postregarding' from='regardingobjectid' to='iroc_routefeedid' link-type='outer' alias='post' >",
            "<attribute name='latestmanualpostmodifiedon' />",
            "</link-entity>",
            "</entity>",
            "</fetch>",
        ].join("");
        FS.RFItemList = [];
        MobileCRM.FetchXml.Fetch.executeFromXML(
            fetchXml, function (routeFeedRecords) {
                for (var i in routeFeedRecords) {
                    var rfRecord = routeFeedRecords[i].properties;
                    //Create Array List of Objects
                    var newItem = new Object();
                    newItem.RFId = rfRecord["iroc_routefeedid"];
                    newItem.RFName = rfRecord["brb.name"];
                    newItem.RFNote = rfRecord["iroc_notes"] == undefined ? "" : rfRecord["iroc_notes"];
                    newItem.ForemanGroupPicklistValue = rfRecord["pad.iroc_foremangroup"] == undefined ? null : rfRecord["pad.iroc_foremangroup"];
                    newItem.CreatedOn = rfRecord["createdon"];
                    newItem.CompletedBy = rfRecord["createdby"] === undefined ? null : rfRecord["createdby"].primaryName;
                    newItem.AnnotationId = rfRecord["notes.annotationid"] === undefined ? null : rfRecord["notes.annotationid"];
                    if (rfRecord["notes.isdocument"] == true) {
                        newItem.Attachment = "visible";
                    }
                    else {
                        newItem.Attachment = "hidden";
                    }
                    var postContainsData = null;
                    postContainsData = rfRecord["post.latestmanualpostmodifiedon"] === undefined ? null : true;
                    if (postContainsData == true) {
                        newItem.Post = "visible";
                    }
                    else {
                        newItem.Post = "hidden";
                    }
                    FS.RFItemList.push(newItem);
                }
                FS.RouteFeed.applyFilters();

            }, function (error) {
                document.getElementById("loader").style.display = "none";
                MobileCRM.bridge.alert("Get RFs Error: " + error);
            }, null);
    },

    applyFilters: function () {
        var tempRFArray = FS.RFItemList;
        //Filter the RF Array to just the selected foreman groups
        var tempForemanArray = tempRFArray;
        if (FS.SelectedForemanGroups.toString() != "-1") {
            tempForemanArray = jQuery.grep(tempRFArray, function (n, i) {
                if (n.ForemanGroupPicklistValue != null && (n.ForemanGroupPicklistValue.toString() === FS.SelectedForemanGroups.toString())) {
                    return true;
                }
                return false;

            });
        }
        FS.RouteFeed.buildTable(tempForemanArray);
    },

    onchange: function () {
        var e = document.getElementById("foremangroupfilter");
        var value = e.options[e.selectedIndex].value;
        FS.SelectedForemanGroups = value.toString();
        FS.RouteFeed.applyFilters();
    }

};
