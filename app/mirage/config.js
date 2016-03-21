import AddonFixture from "./fixtures/addon";

export default function() {}

/*
 * Only loaded during tests
 */
export function testConfig() {

  this.get('/gists', function(db) {
    return db.gists;
  });

  this.get('/gists/:id', function(db, request) {
    let id = request.params.id;
    return db.gists.find(id);
  });

  this.get('/gists/:id/:rev_id', function(db, request) {
    let id = request.params.id;
    return db["gist-revisions"].find(id);
  });

  this.get('/user', function(db) {
    return db.users.find(1);
  });

  this.get('https://nl1fctyzr7.execute-api.us-east-1.amazonaws.com/staging/addon', function() {
    return AddonFixture;
  });
}
