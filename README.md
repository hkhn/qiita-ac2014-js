これは Qiita の JavaScript Advent Calendar 2014 に向けて書いたものです。

## はじめに

Qiita 初投稿ながら Advent Calendar 書かせて頂きます。
書きたかった他の方々すみません。

この記事は、自分も含めて、
「Grunt とか gulp.js とか、名前は聞くけどそういうのよく分からないよ」
「使ってみたけど、なんか上手く行かないよ」
という人たち向けの記事です。

巷では「gulp.js 使えよ」という風潮をひしひしと感じますが、
素人には Grunt の方が取っ付き易いなあ、と思うところがあったので Grunt の記事にします。

お世話になってきた Grunt への追悼もちょっぴり込めて…

## Grunt を使ってみよう

既に秀逸な記事が沢山あるのでさらっと。
ここでは [grunt-init](https://github.com/gruntjs/grunt-init) を利用してひな形を作りましょう。

```shell-session
$ grunt-init gruntfile
$ npm install
```

かんたんですね。
今回はテストが主題じゃないので、適当な JavaScript ファイルを少しだけ作りましょう。

```js
// lib/foo.js
(function() {
  return { foo: function() { return 'foo'; } };
})();

// lib/bar.js
(function() {
  return { bar: function() { return 'bar'; } };
})();

// lib/baz.js
(function() {
  return { baz: function() { return 'baz'; } };
})();
```

では、実行。

```shell-session
$ grunt jshint
```

やったー！

## Grunt プラグインを使ってみよう

ちょっとずつ本題に。
今回取り上げたいのは teppeis 氏による超便利プラグイン [grunt-parallelize](http://teppeis.hatenablog.com/entry/2013/12/grunt-parallelize) です。

```js
// grunt.initConfig
    parallelize: {
      jshint: {
        lib_test: 2
      }
    }

// ...

grunt.loadNpmTasks('grunt-parallelize');
```

では、実行。

```shell-session
$ grunt parallelize:jshint
```

並列処理がぐっと身近になりますね！

この調子で uglify もやってみましょう。
大きなプロジェクトになってきたら、uglify も並列実行したいですよね。きっと。

```js
// grunt.initConfig
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
      uglify: {
        lib: 2
      }
    }
```

では、実行。

```shell-session
$ grunt parallelize:uglify
    ....
        Warning: Unable to write "undefined" file (Error code: undefined). Use --force to continue.
    ....
```

失敗…？

## Grunt プラグインをカスタマイズしてみよう

grunt-parallelize を使ったときに files.dest の情報がなくなってしまうので、それを補完してやります。
こういう時 grunt.renameTask って便利ですよね。

```js
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
```

エラー処理等を全然してないのはご愛嬌。

では、実行。

```
$ grunt parallelize:uglify
```

動きましたよね？

もっとスマートにもできたと思いますが、時間限界なのでこの辺で。
こんなやり方もありますよ、ということで。

## おわりに

先人達の資産を上手に使えば、素人でもプラグインを使って色んなことができそうです。
分からない内は Grunt でも gulp.js でも良いので、とにかく色々触ってみると良いですね。

明日からの皆様の濃密な内容に期待しています :smiley:
