import { computed } from '@ember/object';
import DS from 'ember-data';

const { attr, belongsTo } = DS;

export default DS.Model.extend({
  url: attr('string'),
  committedAt: attr('date'),
  gist: belongsTo('gist'),

  shortId: computed('id', function() {
    return (this.get('id')||'').substring(0,7);
  })
});
