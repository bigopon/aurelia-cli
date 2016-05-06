"use strict";
const path = require('path');
const fs = require('./file-system');
const string = require('./string');
const ProjectItem = require('./project-item');

exports.Project = class {
  static establish(dir) {
    process.chdir(dir);

    return fs.readFile(path.join(dir, 'aurelia_project', 'aurelia.json')).then(model => {
      return fs.readFile(path.join(dir, 'package.json')).then(pack => {
        return new exports.Project(dir, JSON.parse(model.toString()), JSON.parse(pack.toString()));
      });
    });
  }

  constructor(directory, model, pack) {
    this.directory = directory;
    this.model = model;
    this.package = pack;
    this.taskDirectory = path.join(directory, 'aurelia_project/tasks');
    this.generatorDirectory = path.join(directory, 'aurelia_project/generators');

    this.locations = [
      this.root = ProjectItem.directory(model.paths.root),
      this.resources = ProjectItem.directory(model.paths.resources),
      this.attributes = ProjectItem.directory(model.paths.attributes),
      this.elements = ProjectItem.directory(model.paths.elements),
      this.valueConverters = ProjectItem.directory(model.paths.valueConverters),
      this.bindingBehaviors = ProjectItem.directory(model.paths.bindingBehaviors)
    ];
  }

  commitChanges() {
    return Promise.all(this.locations.map(x => x.create()));
  }

  makeFileName(name) {
    return string.sluggify(name);
  }

  makeClassName(name) {
    return string.captialCase(name);
  }

  installTranspiler() {
    installBabel();
  }

  getPrimaryExport(m) {
    return m.default;
  }

  getGeneratorMetadata() {
    return getMetadata(this.generatorDirectory);
  }

  getTaskMetadata() {
    return getMetadata(this.taskDirectory);
  }

  resolveGenerator(name) {
    let potential = path.join(this.generatorDirectory, `${name}.js`);
    return fs.exists(potential).then(result => result ? potential : null);
  }

  resolveTask(name) {
    let potential = path.join(this.taskDirectory, `${name}.js`);
    return fs.exists(potential).then(result => result ? potential : null);
  }
}

function getMetadata(dir) {
  return fs.readdir(dir).then(files => {
    return Promise.all(
      files
        .sort()
        .map(file => path.join(dir, file))
        .filter(file => path.extname(file) === '.json')
        .map(file => fs.readFile(file).then(data => JSON.parse(data.toString())))
    );
  });
}

function installBabel() {
  require('babel-polyfill');
  require('babel-register')({
    plugins: [
      'transform-es2015-modules-commonjs'
    ],
    only: /aurelia_project/
  });
}