"use strict";

/* пути к исходным файлам (src), к готовым файлам (build), а также к тем, за изменениями которых нужно наблюдать (watch) */
var path = {
  build: {
    html: "dist/",
    js: "dist/scripts/",
    css: "dist/styles/css/",
    img: "dist/assets/",
    fonts: "dist/fonts/",
  },
  src: {
    html: "src/*.html",
    js: "src/scripts/main.js",
    style: "src/styles/scss/main.scss",
    img: "src/assets/img/*.*",
    fonts: "src/fonts/**/*.*",
  },
  watch: {
    html: "src/*.html",
    js: "src/scripts/**/*.js",
    css: "src/styles/**/*.scss",
    img: "src/assets/img/**/*.*",
    fonts: "srs/fonts/**/*.*",
  },
  clean: "./dist/*",
};

/* настройки сервера */
var config = {
  server: {
    baseDir: "./dist",
  },
  notify: false,
};

/* подключаем gulp и плагины */
var gulp = require("gulp"), // подключаем Gulp
  webserver = require("browser-sync"), // сервер для работы и автоматического обновления страниц
  plumber = require("gulp-plumber"), // модуль для отслеживания ошибок
  rigger = require("gulp-rigger"), // модуль для импорта содержимого одного файла в другой
  sourcemaps = require("gulp-sourcemaps"), // модуль для генерации карты исходных файлов
  sass = require("gulp-sass")(require("sass")), // модуль для компиляции SASS (SCSS) в CSS
  autoprefixer = require("gulp-autoprefixer"), // модуль для автоматической установки автопрефиксов
  cleanCSS = require("gulp-clean-css"), // плагин для минимизации CSS
  uglify = require("gulp-uglify"), // модуль для минимизации JavaScript
  cache = require("gulp-cache"), // модуль для кэширования
  imagemin = require("gulp-imagemin"), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
  jpegrecompress = require("imagemin-jpeg-recompress"), // плагин для сжатия jpeg
  pngquant = require("imagemin-pngquant"), // плагин для сжатия png
  del = require("del"), // плагин для удаления файлов и каталогов
  rename = require("gulp-rename");

var svgSprite = require("gulp-svg-sprites"),
  svgmin = require("gulp-svgmin"),
  cheerio = require("gulp-cheerio"),
  replace = require("gulp-replace");

/* задачи */

// запуск сервера
gulp.task("webserver", function () {
  webserver(config);
});

// сбор html
gulp.task("html:build", function () {
  return gulp
    .src(path.src.html) // выбор всех html файлов по указанному пути
    .pipe(plumber()) // отслеживание ошибок
    .pipe(rigger()) // импорт вложений
    .pipe(gulp.dest(path.build.html)) // выкладывание готовых файлов
    .pipe(webserver.reload({ stream: true })); // перезагрузка сервера
});

// сбор стилей
gulp.task("css:build", function () {
  return (
    gulp
      .src(path.src.style) // получим main.scss
      .pipe(plumber()) // для отслеживания ошибок
      .pipe(sourcemaps.init()) // инициализируем sourcemap
      .pipe(sass().on("error", showError)) // scss -> css
      .pipe(autoprefixer()) // добавим префиксы
      .pipe(gulp.dest(path.build.css))
      // .pipe(rename({ suffix: ".min" }))
      // .pipe(cleanCSS()) // минимизируем CSS
      .pipe(sourcemaps.write()) // записываем sourcemap
      .pipe(gulp.dest(path.build.css)) // выгружаем в build
      .pipe(webserver.reload({ stream: true }))
  ); // перезагрузим сервер
});
function showError(error) {
  console.log(error.toString());
  this.emit("end");
}
// сбор js
gulp.task("js:build", function () {
  return gulp
    .src(path.src.js) // получим файл main.js
    .pipe(plumber()) // для отслеживания ошибок
    .pipe(rigger()) // импортируем все указанные файлы в main.js
    .pipe(gulp.dest(path.build.js))
    .pipe(rename({ suffix: ".min" }))
    .pipe(sourcemaps.init()) //инициализируем sourcemap
    .pipe(uglify()) // минимизируем js
    .pipe(sourcemaps.write("./")) //  записываем sourcemap
    .pipe(gulp.dest(path.build.js)) // положим готовый файл
    .pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// перенос шрифтов
gulp.task("fonts:build", function () {
  return gulp.src(path.src.fonts).pipe(gulp.dest(path.build.fonts));
});

// обработка картинок
gulp.task("image:build", function () {
  return gulp
    .src(path.src.img) // путь с исходниками картинок
    .pipe(
      cache(
        imagemin([
          // сжатие изображений
          imagemin.gifsicle({ interlaced: true }),
          jpegrecompress({
            progressive: true,
            max: 90,
            min: 80,
          }),
          pngquant(),
          imagemin.svgo({ plugins: [{ removeViewBox: false }] }),
        ])
      )
    )
    .pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

// удаление каталога build
gulp.task("clean:build", function () {
  return del(path.clean);
});

// очистка кэша
gulp.task("cache:clear", function () {
  cache.clearAll();
});

// сборка
gulp.task(
  "build",
  gulp.series(
    "clean:build",
    gulp.parallel(
      "html:build",
      "css:build",
      "js:build",
      "fonts:build",
      "image:build"
    )
  )
);

// запуск задач при изменении файлов
gulp.task("watch", function () {
  gulp.watch(path.watch.html, gulp.series("html:build"));
  gulp.watch(path.watch.css, gulp.series("css:build"));
  gulp.watch(path.watch.js, gulp.series("js:build"));
  // gulp.watch(path.watch.img, gulp.series("image:build"));
  // gulp.watch(path.watch.fonts, gulp.series("fonts:build"))
});

// задача по умолчанию
gulp.task("default", gulp.series("build", gulp.parallel("webserver", "watch")));
