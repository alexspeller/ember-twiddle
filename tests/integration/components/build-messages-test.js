/* eslint-disable no-console */
import EmberObject from '@ember/object';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('build-messages', 'Integration | Component | build messages', {
  integration: true,
  beforeEach() {
    this.cacheConsole = console.error;
  },
  afterEach() {
    console.error = this.cacheConsole;
  }
});

test('it shows the number of build messages', function(assert) {
  assert.expect(2);

  this.set('buildErrors', []);
  this.set('isBuilding', false);
  this.set('notify', {
    info() {},
    error() {}
  });

  this.render(hbs`{{build-messages buildErrors=buildErrors isBuilding=isBuilding notify=notify}}`);

  assert.equal(this.$('span').text().replace(/\s+/g, " ").trim(), 'Output ( build ok. )', 'shows build ok when no buildErrors');

  this.set('buildErrors', ['error1', 'error2']);

  assert.equal(this.$('span').text().replace(/\s+/g, " ").trim(), 'Output ( 2 build errors )', 'shows number of build errors');
});

test('it calls notify.errpr() when clicking on build errors', function(assert) {
  assert.expect(1);

  let notifyObject = EmberObject.create({
    called: false,
    info() {},
    error() {
      this.set('called', true);
    }
  });

  console.error = () => {};
  this.set('buildErrors', ['error1', 'error2']);
  this.set('isBuilding', false);
  this.set('notify', notifyObject);

  this.render(hbs`{{build-messages buildErrors=buildErrors isBuilding=isBuilding notify=notify}}`);

  this.$('span a').click();

  assert.ok(notifyObject.get('called'), "notify.error() was called");
});
