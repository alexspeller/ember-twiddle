import DS from 'ember-data';
import Path from 'npm:path';
import Babel from "npm:babel";

export default DS.Model.extend({
  fileType: DS.attr('string'),
  fileName: DS.attr('string'),
  content: DS.attr('string'),
  gist: DS.belongsTo('gist'),

  /*
    Replace dots with slashes, Gists can't have directories
   */
  filePath: Em.computed('fileName', function(key, value) {
    if(value) {
      this.set('fileName', value.replace(/\//gi, '.'));
    }

    var fileName = this.get('fileName');
    var parts = fileName.split('.');
    return parts.slice(0,-1).join('/') + '.' + parts.slice(-1);
  }),

  extension: Em.computed('filePath', function () {
    return Path.extname(this.get('filePath'));
  }),

  nameWithModule: Em.computed('filePath', function () {
    // Remove app prefix if present
    let name = this.get('filePath').replace(/^app\//, '');

    return Path.join('demo-app',
      Path.dirname(name), Path.basename(name, Path.extname(name)));
  }),

  compileJs () {
    return this.tryCompile(() =>
      Babel.transform(this.get('content'), {
        modules: 'amd',
        moduleId: this.get('nameWithModule')
      }).code);
  },

  compileHbs() {
    return this.tryCompile(() =>
      Em.HTMLBars.compile(this.get('content') || ''));
  },

  tryCompile(compile) {
    try {
      var result = compile();
      this.set('buildError', null);
      this.set('errorMessage', null);
      return result;
    } catch (e) {
      this.set('errorMessage', e.message);
      e.file = this.get('filePath');
      this.set('buildError', e);
    }
  },

  editorMode: Em.computed('extension', function () {
    switch(this.get('extension')) {
      case '.js':
        return 'javascript';
      case '.hbs':
        return 'htmlmixed';
      default:
        return 'html';
    }
  }),

  compiled: Em.computed('content', 'extension', function () {
    switch(this.get('extension')) {
      case '.js':
        return this.compileJs();
      case '.hbs':
        return this.compileHbs();
      default:
        return '<Unknown file type>';
    }
  }),

  updateRegistry: Ember.observer('content', 'nameWithModule', function() {
      var name = this.get('nameWithModule');
      var compiled = this.get('compiled');
      if (name && compiled) {
        delete window.requirejs.seen[name];
        eval(compiled);
      }
  }),

  /**
    We need to register deletes.
   */
  registerDeleteOnGist: Em.observer('isDeleted', function() {
    if(!this.get('gist')) {
      return;
    }

    this.get('gist').registerDeletedFile(this.get('id'));
  })
});
