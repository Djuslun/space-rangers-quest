import * as fs from "fs";
import * as assert from "assert";
import "mocha";

import { QMPlayer, GameState } from "../lib/qmplayer";
import { parse, QM } from "../lib/qmreader";
import { substitute } from "../lib/substitution";
import * as formula from "../lib/formula";
import { PlayerSubstitute } from "../lib/qmplayer/playerSubstitute";
import { randomFromMathRandom } from "../lib/randomFunc";

const srcDir = __dirname + `/../../borrowed/qm/`;
describe(`Checking all quests for formulas and params substitution`, function() {
  this.timeout(60 * 1000);
  for (const origin of fs.readdirSync(srcDir)) {
    for (const f of fs.readdirSync(srcDir + origin)) {
      const fullname = srcDir + origin + "/" + f;
      describe(`Checking quest ${fullname}`, () => {
        let quest: QM;
        let params: number[];
        const player: PlayerSubstitute = {
          Ranger: "Ranger",
          Player: "Player",
          FromPlanet: "FromPlanet",
          FromStar: "FromStar",
          ToPlanet: "ToPlanet",
          ToStar: "ToStar",
          Date: "Date",
          Day: "Day",
          Money: "Money",
          CurDate: "CurDate",
          lang: "rus"
        };
        function check(str: string, place = "", isDiamond = false) {
          try {
            substitute(
              str,
              player,
              params,
              randomFromMathRandom,
              isDiamond ? 1 : undefined
            );
          } catch (e) {
            throw new Error(`String failed '${str}' with ${e} in ${place}`);
          }
        }
        function checkFormula(str: string, place = "") {
          const staticRandomGenerated = [
            0.8098721706321894,
            0.7650745137670785,
            0.5122628148859116,
            0.7001314250579083,
            0.9777148783782501,
            0.6484951526791192,
            0.6277520602629139,
            0.6271209273581702,
            0.5929518455455183,
            0.555114104030954,
            0.8769248658117874,
            0.9012611135928128,
            0.9887903872842161,
            0.9032020764410791,
            0.09244706438405847,
            0.6841815116128189,
            0.26661520895002355,
            0.95424331893931,
            0.8900907263092355,
            0.9796112746203975
          ];

          function createRandom(staticRandom: number[]) {
            let i = 0;
            return () => {
              i++;
              if (i >= staticRandom.length) {
                throw new Error(`Lots of random`);
                i = 0;
              }
              return staticRandom[i];
            };
          }
          try {
            const formulaResult = formula.parse(
              str,
              params,
              createRandom(staticRandomGenerated)
            );
          } catch (e) {
            throw new Error(`String failed '${str}' with ${e} in ${place}`);
          }
        }
        it(`Loads quest and substitute variables`, () => {
          const data = fs.readFileSync(fullname);
          quest = parse(data);
          params = quest.params.map((p, i) => i * i);
        });
        it(`Creates player and starts (to check init values)`, () => {
          const player = new QMPlayer(quest, [], "rus");
          player.start();
        });
        it(`Starting/ending text`, () => {
          check(quest.taskText, "start");
          check(quest.successText, "success");
        });
        it(`Locations texts and formulas`, () => {
          quest.locations.map(loc => {
            if (
              (f === "Doomino.qm" && loc.id === 28) ||
              (f === "Kiberrazum.qm" && loc.id === 134)
            ) {
              // Doomino: Какой-то там странный текст. Эта локация пустая и все переходы в неё с описанием
              // Kiberrazum: просто локация без переходов в неё
              // Вообще-то это можно и автоматически фильтровать
            } else {
              loc.texts.map(x => x && check(x, `Loc ${loc.id}`));
            }
            loc.paramsChanges.map((p, i) => {
              if (p.critText !== quest.params[i].critValueString) {
                check(p.critText, `Loc ${loc.id} crit param ${i}`);
              }
              if (
                quest.params[i].active &&
                p.isChangeFormula &&
                p.changingFormula
              ) {
                checkFormula(p.changingFormula, `param ${i} in loc=${loc.id}`);
              }
            });
            if (loc.isTextByFormula && loc.textSelectFurmula) {
              checkFormula(
                loc.textSelectFurmula,
                `loc=${loc.id} text select formula`
              );
            }
          });
        });
        it(`Jumps texts and formulas`, () => {
          quest.jumps.map(jump => {
            jump.text && check(jump.text, `Jump ${jump.id} text`);
            jump.description && check(jump.description, `Jump ${jump.id} decr`);
            jump.paramsChanges.map((p, i) => {
              if (p.critText !== quest.params[i].critValueString) {
                check(p.critText, `Jump ${jump.id} crit param ${i}`);
              }
              if (
                quest.params[i].active &&
                p.isChangeFormula &&
                p.changingFormula
              ) {
                checkFormula(
                  p.changingFormula,
                  `param ${i} in jump=${jump.id}`
                );
              }
            });
            if (jump.formulaToPass) {
              checkFormula(
                jump.formulaToPass,
                `Jump id=${jump.id} formula to pass`
              );
            }
          });
        });
        it(`Params ranges`, () => {
          quest.params.map((p, i) => {
            p.showingInfo.map(range => {
              check(range.str, `Param ${i} range`, true);
            });
          });
        });
      });
    }
  }
});
