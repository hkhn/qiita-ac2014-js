/*global module:false, require:false*/

var path = require('path');
var _ = require('lodash');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          jQuery: true
        }
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['lib/**/*.js', 'test/**/*.js']
      }
    },
    nodeunit: {
      files: ['test/**/*_test.js']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: '<%= jshint.lib_test.src %>',
        tasks: ['jshint:lib_test', 'nodeunit']
      }
    },
    uglify: {
      lib: {
        files: [{
          expand: true,
          cwd: 'lib',
          src: '**/*.js',
          dest: 'dist'
        }]
      }
    },
    parallelize: {
      jshint: {
        lib_test: 2
      },
      uglify: {
        lib: 2
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-parallelize');

  grunt.renameTask('uglify', 'uglify_original');
  grunt.registerMultiTask('uglify', 'Override grunt-contrib-uglify', function() {
    var args = this.nameArgs.split(':');
    var target = args[1];
    var files = grunt.config(['uglify', target, 'files']);
    if (files && files[0] && files[0].dest) {
      // Override config
      grunt.config('uglify_original', grunt.config('uglify'));
    } else {
      // Override files.src in original config
      // NOTE Only consider 'expand' pattern
      var originalFiles = grunt.config(['uglify_original', target, 'files']);
      var cwd = originalFiles[0].cwd;
      originalFiles[0].src = _.map(files[0].src, function(p) { return path.relative(cwd, p); });
      grunt.config(['uglify_original', target, 'files'], originalFiles);
    }
    grunt.task.run(['uglify_original'].concat(args.slice(1)).join(':'));
  });

  grunt.renameTask('parallelize', 'parallelize_original');
  grunt.registerMultiTask('parallelize', 'Override grunt-parallelize', function() {
    var args = this.nameArgs.split(':');
    var task = args[1];
    // Override config
    var originalTask = task + '_original';
    grunt.config(originalTask, grunt.config(task));
    grunt.config('parallelize_original', grunt.config('parallelize'));
    // Run grunt-parallelize
    grunt.task.run(['parallelize_original'].concat(args.slice(1)).join(':'));
  });

  // Default task.
  grunt.registerTask('default', ['jshint', 'nodeunit']);

};
