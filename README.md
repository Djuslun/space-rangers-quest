# Онлайн плеер квестов из Космических рейнджеров

[Играть можно тут](https://spacerangers.gitlab.io)

Должно работать во всех современных браузерах

## Происхождение

Основан на описании формата qm `lastqm.txt` и исследовании поведения TGE 4.3.0.

## Сборка

- Файлы квестов (_.qm, _.qmm) нужно извлечь из игры и положить в `borrowed/qm/SR 2.1.2170/`
  - и/или в `borrowed/qm/SR 2.1.2121 eng/`
  - и/или в `borrowed/qm/Tge 4.2.5/`
  - и/или в `borrowed/qm/anyNameHere/`
- Картинки в `borrowed/qm/img/`
- Музыку в `borrowed/qm/music/` (желательно переконвертировать в mp3 чтобы старые браузеры играли тоже)
- Можно так же положить `borrowed/qm/PQI.txt` чтобы картинки отображались корректно (если квесты qmm и взяты с последних версий игры, то необязательно класть PQI.txt потому как имена картинок содержатся в qmm).
- Затем всё собрать:

```
rm -R built-web || true
npm install
npm run tsc
npm run lint
npm run test
mkdir built-web
node built-node/packGameData.js
npm run build
```

## Известные проблемы

- Автопереходы по пустым переходам/локациям работают только в режиме TGE4

## TODO

- См. `info.md`, `info2.md`

## Квесты пересохранённые

### Источник

- SR1 - из Tge 4.2.5
- SR2 - из SR 2.1.2170
- SR2 eng - из SR 2.1.2121

### Пересохранённые

- Glavred: была исправлена 184-я локация с неправильной формулой (третий текст, "...вам всего лишь {[p47])} cr..." -> "...вам всего лишь {[p47]} cr...").
- Gladiator: был пересохранен потому как там совсем какой-то древний формат
- Prison из TGE переименован в Prison1 чтобы не было коллизии

## Webpack devserver

`npm start`
