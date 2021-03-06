.pragma library
.import QtQuick.LocalStorage 2.0 as Storage

var db = null

var settings = {
    name: "Received",
    version: "",
    description: "unofficial rad.io client",
    size: 1000000,
    latestVersion: 3
}

var dbVersions = {
    1: 'CREATE TABLE IF NOT EXISTS stations(id INTEGER PRIMARY KEY,\
            name TEXT, pictureBaseURL TEXT, picture1Name TEXT, country TEXT, genre TEXT);',
    2: 'CREATE TABLE IF NOT EXISTS SleepTimer(hour INTEGER, minute INTEGER)',
    3: 'INSERT INTO SleepTimer values(0, 20)'

}

function openDB() {
    if(db !== null)
        return;

    db = Storage.LocalStorage.openDatabaseSync(settings.name,
                                               settings.version,
                                               settings.description,
                                               settings.size);

    var currentVersion = (db.version === "") ? 0 : parseInt(db.version);
    console.log("CURRENT DB VERSION: " + currentVersion)

    // Update database to latest version
    for(; currentVersion < settings.latestVersion; ++currentVersion) {
        var nextVersion = currentVersion+1;
        db.changeVersion(db.version, nextVersion, function(tx) {
            tx.executeSql(dbVersions[nextVersion]);
            console.log('Database updated to: '+nextVersion);
        });

        db = Storage.LocalStorage.openDatabaseSync(settings.name,
                                                   settings.version,
                                                   settings.description,
                                                   settings.size);
    }
}

function loadStations() {
    var results;
    openDB();
    db.transaction(function(tx) {
        results = tx.executeSql("SELECT * FROM stations");
    });
    return results;
}

function saveStation(station) {
    var result;
    openDB();
    db.transaction(function(tx) {
        result = tx.executeSql('REPLACE INTO stations (id, name, pictureBaseURL, picture1Name, \
                                country, genre) \
                                VALUES(?, ?, ?, ?, ?, ?)',
                                [station.id, station.name, station.pictureBaseURL,
                                station.picture1Name, station.country, station.oneGenre])

    });
    return result;
}

function deleteStation(station) {
    var result;
    openDB();
    db.transaction(function(tx) {
        result = tx.executeSql('DELETE FROM stations WHERE id = ?', [station.id])
    });
    return result;
}

function stationExists(station) {
    var results;
    console.log("Checking isFavorite", station)
    openDB();
    db.transaction(function(tx) {
        results = tx.executeSql("SELECT * FROM stations WHERE id=? LIMIT 1", [station.id]);
    });
    console.log("STATION EXISTS RESULTS: " + results.rows.length)
    return results.rows.length === 1
}

function loadSleepTimer() {
    var results;
    openDB();
    db.transaction(function(tx) {
        results = tx.executeSql("SELECT hour, minute FROM SleepTimer LIMIT 1");
    });
    return results.rows.item(0);
}

function updateSleepTimer(h, m) {
    var result;
    openDB();
    db.transaction(function(tx) {
        result = tx.executeSql('UPDATE SleepTimer SET hour=?, minute=?', [h, m])

    });
    return result;
}

function dropDB() {
    db.changeVersion(db.version, "", function(tx) {
        tx.executeSql("DROP TABLE IF EXISTS stations");
        console.log("db dropt")
    });

    db = null;
}
