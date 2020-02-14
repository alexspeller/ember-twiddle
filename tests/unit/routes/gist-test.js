import EmberObject from '@ember/object';
import RSVP from 'rsvp';
import { moduleFor, test } from 'ember-qunit';

moduleFor('route:gist', {
  needs: [
    'service:notify',
    'service:app',
    'service:fastboot'
  ],

  beforeEach() {
    this._originalConfirm = window.confirm;
    this._originalAlert = window.alert;
  },

  afterEach() {
    window.confirm = this._originalConfirm;
    window.alert = this._originalAlert;
  }
});

test('deleting a gist requires confirmation', function(assert) {
  let controller = this.subject({
    transitionTo() { return RSVP.resolve(); },
    notify: {
      info() {}
    }
  });
  let gistClass = EmberObject.extend({
    called: false,
    destroyRecord() {
      this.set('called', true);
    }
  });

  window.confirm = () => true;
  let gist = gistClass.create();
  controller.send('deleteGist', gist);
  assert.ok(gist.get('called'), 'gist.destroyRecord was called when confirmed');

  window.confirm = () => false;
  gist = gistClass.create();
  controller.send('deleteGist', gist);
  assert.ok(!gist.get('called'), 'gist.destroyRecord was not called when not confirmed');
});
