import Component from '@ember/component';
import { alias } from '@ember/object/computed';

export default Component.extend({
  tagName: 'a',
  classNames: ['user-link'],
  attributeBindings: ['href', 'target'],
  target: 'blank',
  href: alias('user.htmlUrl'),
});
