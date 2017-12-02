//import 'text-encoding';

export const LOCATION_TEXTS = 10;

class Reader {
    private i = 0;
    constructor(private data: Buffer) {}
    int32() {
        const result = this.data.readInt32LE(this.i);
        /*
        const result = this.data[this.i] +
                      this.data[this.i + 1] * 0x100 +
                    this.data[this.i + 2] * 0x10000 +
                    this.data[this.i + 3] * 0x1000000;
          */

        this.i += 4;
        return result;
    }
    readString() {
        const ifString = this.int32();
        if (ifString) {
            const strLen = this.int32();
            const str = this.data
                .slice(this.i, this.i + strLen * 2)
                .toString("utf16le");
            //const str = new TextDecoder("utf16le").decode(this.data.slice(this.i, this.i + strLen * 2))
            this.i += strLen * 2;
            return str;
        } else {
            return "";
        }
    }
    byte() {
        return this.data[this.i++];
    }
    dwordFlag(expected?: number) {
        const val = this.int32();
        if (expected !== undefined && val !== expected) {
            throw new Error(
                `Expecting ${expected}, but get ${val} at position ${this.i -
                    4}`
            );
        }
    }
    float64() {
        const val = this.data.readDoubleLE(this.i);
        this.i += 8;
        return val;
    }
    seek(n: number) {
        this.i += n;
    }
    isNotEnd() {
        if (this.data.length === this.i) {
            return undefined;
        } else {
            return (
                `Not an end! We are at ` +
                `0x${Number(this.i).toString(16)}, file len=0x${Number(
                    this.data.length
                ).toString(16)} ` +
                ` left=0x${Number(this.data.length - this.i).toString(16)}`
            );
        }
    }

    debugShowHex(n: number = 300) {
        console.info("Data at 0x" + Number(this.i).toString(16) + "\n");
        let s = "";
        for (let i = 0; i < n; i++) {
            s =
                s +
                ("0" + Number(this.data[this.i + i]).toString(16)).slice(-2) +
                ":";
            if (i % 16 === 15) {
                s = s + "\n";
            }
        }
        console.info(s);
    }
}

enum PlayerRace {
    Малоки = 1,
    Пеленги = 2,
    Люди = 4,
    Феяне = 8,
    Гаальцы = 16
}
enum PlanetRace {
    Малоки = 1,
    Пеленги = 2,
    Люди = 4,
    Феяне = 8,
    Гаальцы = 16,
    Незаселенная = 64
}

enum WhenDone {
    OnReturn = 0,
    OnFinish = 1
}
enum PlayerCareer {
    Торговец = 1,
    Пират = 2,
    Воин = 4
}

type HeaderMagic =
    | 0x423a35d6
    | 0x423a35d7
    | 0x423a35d3
    | 0x423a35d2
    | 0x423a35d4;

interface QMBase {
    givingRace: number;
    whenDone: WhenDone;
    planetRace: number;
    playerCareer: number;
    playerRace: number;
    // reputationChange
    defaultJumpCountLimit: number;
    hardness: number;
    paramsCount: number;

    changeLogString?: string;
    majorVersion?: number;
    minorVersion?: number;
}

function parseBase(r: Reader, header: HeaderMagic): QMBase {
    if (header === 0x423a35d6 || header === 0x423a35d7) {
        const majorVersion = header === 0x423a35d7 ? r.int32() : undefined;
        const minorVersion = header === 0x423a35d7 ? r.int32() : undefined;
        const changeLogString =
            header === 0x423a35d7 ? r.readString() : undefined;

        const givingRace = r.byte();
        const whenDone = r.byte();
        const planetRace = r.byte();
        const playerCareer = r.byte();
        const playerRace = r.byte();
        const reputationChange = r.int32();

        const screenSizeX = r.int32(); // In pixels
        const screenSizeY = r.int32(); // In pixels
        const widthSize = r.int32(); // Grid width, from small to big 1E-16-0F-0A
        const heigthSize = r.int32(); // Grid heigth, from small to big 18-12-0C-08
        const defaultJumpCountLimit = r.int32();
        const hardness = r.int32();

        const paramsCount = r.int32();

        return {
            givingRace,
            whenDone,
            planetRace,
            playerCareer,
            playerRace,
            defaultJumpCountLimit,
            hardness,
            paramsCount,
            changeLogString,
            majorVersion,
            minorVersion
        };
    } else {
        const paramsCount =
            header === 0x423a35d3
                ? 48
                : header === 0x423a35d2
                  ? 24
                  : header === 0x423a35d4 ? 96 : undefined;
        if (!paramsCount) {
            throw new Error(`Unknown header ${header}`);
        }
        r.dwordFlag();
        const givingRace = r.byte();
        const whenDone = r.byte();
        r.dwordFlag();
        const planetRace = r.byte();
        r.dwordFlag();
        const playerCareer = r.byte();
        r.dwordFlag();
        const playerRace = r.byte();
        const reputationChange = r.int32();
        r.dwordFlag();
        r.dwordFlag();
        r.dwordFlag();
        r.dwordFlag();
        r.dwordFlag();
        const defaultJumpCountLimit = r.int32();
        const hardness = r.int32();
        return {
            givingRace,
            whenDone,
            planetRace,
            playerCareer,
            playerRace,
            defaultJumpCountLimit,
            hardness,
            paramsCount
        };
    }
}

export enum ParamType {
    Обычный = 0,
    Провальный = 1,
    Успешный = 2,
    Смертельный = 3
}
export enum ParamCritType {
    Максимум = 0,
    Минимум = 1
}

interface QMParamShowInfo {
    from: number;
    to: number;
    str: string;
}
interface Media {
    img: string | undefined;
    sound: string | undefined;
    track: string | undefined;
}
export interface QMParam extends Media {
    min: number;
    max: number;
    type: ParamType;
    showWhenZero: boolean;
    critType: ParamCritType;
    active: boolean;
    showingRangesCount: number;
    isMoney: boolean;
    name: string;
    showingInfo: QMParamShowInfo[];
    starting: string;
    critValueString: string;
}

function parseParam(r: Reader): QMParam {
    const min = r.int32();
    const max = r.int32();
    r.int32();
    const type = r.byte();
    r.int32();
    const showWhenZero = !!r.byte();
    const critType = r.byte();
    const active = !!r.byte();
    const showingRangesCount = r.int32();
    const isMoney = !!r.byte();
    const name = r.readString();
    const param: QMParam = {
        min,
        max,
        type,
        showWhenZero,
        critType,
        active,
        showingRangesCount,
        isMoney,
        name,
        showingInfo: [],
        starting: "",
        critValueString: "",
        img: undefined,
        sound: undefined,
        track: undefined
    };
    for (let i = 0; i < showingRangesCount; i++) {
        const from = r.int32();
        const to = r.int32();
        const str = r.readString();
        param.showingInfo.push({
            from,
            to,
            str
        });
    }
    param.critValueString = r.readString();
    param.starting = r.readString();
    return param;
}
function parseParamQmm(r: Reader): QMParam {
    const min = r.int32();
    const max = r.int32();
    // console.info(`Param min=${min} max=${max}`)
    const type = r.byte();
    //r.debugShowHex(16);
    const unknown1 = r.byte();
    const unknown2 = r.byte();
    const unknown3 = r.byte();
    if (unknown1 !== 0) {
        console.warn(`Unknown1 is params is not zero`);
    }
    if (unknown2 !== 0) {
        console.warn(`Unknown2 is params is not zero`);
    }
    if (unknown3 !== 0) {
        console.warn(`Unknown3 is params is not zero`);
    }
    const showWhenZero = !!r.byte();
    const critType = r.byte();
    const active = !!r.byte();

    const showingRangesCount = r.int32();
    const isMoney = !!r.byte();

    const name = r.readString();
    const param: QMParam = {
        min,
        max,
        type,
        showWhenZero,
        critType,
        active,
        showingRangesCount,
        isMoney,
        name,
        showingInfo: [],
        starting: "",
        critValueString: "",
        img: undefined,
        sound: undefined,
        track: undefined
    };
    // console.info(`Ranges=${showingRangesCount}`)
    for (let i = 0; i < showingRangesCount; i++) {
        const from = r.int32();
        const to = r.int32();
        const str = r.readString();
        param.showingInfo.push({
            from,
            to,
            str
        });
    }
    param.critValueString = r.readString();
    param.img = r.readString();
    param.sound = r.readString();
    param.track = r.readString();
    param.starting = r.readString();
    return param;
}

export interface QM extends QMBase, QMBase2 {
    params: QMParam[];
    locations: Location[];
    jumps: Jump[];
}

interface QMBase2 {
    strings: {
        ToStar: string;
        Parsec: string | undefined;
        Artefact: string | undefined;
        ToPlanet: string;
        Date: string;
        Money: string;
        FromPlanet: string;
        FromStar: string;
        Ranger: string;
    };
    locationsCount: number;
    jumpsCount: number;
    successText: string;
    taskText: string;
}
function parseBase2(r: Reader, isQmm: boolean): QMBase2 {
    const ToStar = r.readString();

    const Parsec = isQmm ? undefined : r.readString();
    const Artefact = isQmm ? undefined : r.readString();

    const ToPlanet = r.readString();
    const Date = r.readString();
    const Money = r.readString();
    const FromPlanet = r.readString();
    const FromStar = r.readString();
    const Ranger = r.readString();

    const locationsCount = r.int32();
    const jumpsCount = r.int32();

    const successText = r.readString();

    const taskText = r.readString();

    const unknownText = isQmm ? undefined : r.readString();

    return {
        strings: {
            ToStar,
            Parsec,
            Artefact,
            ToPlanet,
            Date,
            Money,
            FromPlanet,
            FromStar,
            Ranger
        },
        locationsCount,
        jumpsCount,
        successText,
        taskText
    };
}

export enum ParameterShowingType {
    НеТрогать = 0x00,
    Показать = 0x01,
    Скрыть = 0x02
}

export interface ParameterChange extends Media {
    change: number;
    isChangePercentage: boolean;
    isChangeValue: boolean;
    isChangeFormula: boolean;
    changingFormula: string;
    showingType: ParameterShowingType;
    critText: string;
}

export enum ParameterChangeType {
    Value = 0x00,
    Summ = 0x01,
    Percentage = 0x02,
    Formula = 0x03
}

export enum LocationType {
    Ordinary = 0x00,
    Starting = 0x01,
    Empty = 0x02,
    Success = 0x03,
    Faily = 0x04,
    Deadly = 0x05
}

export interface Location {
    dayPassed: boolean;
    id: number;
    isStarting: boolean;
    isSuccess: boolean;
    isFaily: boolean;
    isFailyDeadly: boolean;
    isEmpty: boolean;

    paramsChanges: ParameterChange[];
    texts: string[];
    media: Media[];
    isTextByFormula: boolean;
    textSelectFurmula: string;
    maxVisits: number;
}
function parseLocation(r: Reader, paramsCount: number): Location {
    const dayPassed = !!r.int32();
    r.seek(8);
    const id = r.int32();
    const isStarting = !!r.byte();
    const isSuccess = !!r.byte();
    const isFaily = !!r.byte();
    const isFailyDeadly = !!r.byte();
    const isEmpty = !!r.byte();

    const paramsChanges: ParameterChange[] = [];
    for (let i = 0; i < paramsCount; i++) {
        r.seek(12);
        const change = r.int32();
        const showingType = r.byte();
        r.seek(4);
        const isChangePercentage = !!r.byte();
        const isChangeValue = !!r.byte();
        const isChangeFormula = !!r.byte();
        const changingFormula = r.readString();
        r.seek(10);
        const critText = r.readString();
        paramsChanges.push({
            change,
            showingType,
            isChangePercentage,
            isChangeValue,
            isChangeFormula,
            changingFormula,
            critText,
            img: undefined,
            track: undefined,
            sound: undefined
        });
    }
    const texts: string[] = [];
    const media: Media[] = [];
    for (let i = 0; i < LOCATION_TEXTS; i++) {
        texts.push(r.readString());
        media.push({ img: undefined, sound: undefined, track: undefined });
    }
    const isTextByFormula = !!r.byte();
    r.seek(4);
    r.readString();
    r.readString();
    const textSelectFurmula = r.readString();

    return {
        dayPassed,
        id,
        isEmpty,
        isFaily,
        isFailyDeadly,
        isStarting,
        isSuccess,
        paramsChanges,
        texts,
        media,
        isTextByFormula,
        textSelectFurmula,
        maxVisits: 0
    };
}
function parseLocationQmm(r: Reader, paramsCount: number): Location {
    const dayPassed = !!r.int32();

    const locX = r.int32(); /* In pixels */
    const locY = r.int32(); /* In pixels */

    const id = r.int32();
    const maxVisits = r.int32();

    const type = r.byte() as LocationType;
    const isStarting = type === LocationType.Starting;
    const isSuccess = type === LocationType.Success;
    const isFaily = type === LocationType.Faily;
    const isFailyDeadly = type === LocationType.Deadly;
    const isEmpty = type === LocationType.Empty;

    const paramsChanges: ParameterChange[] = [];

    for (let i = 0; i < paramsCount; i++) {
        paramsChanges.push({
            change: 0,
            showingType: ParameterShowingType.НеТрогать,
            isChangePercentage: false,
            isChangeValue: false,
            isChangeFormula: false,
            changingFormula: "",
            critText: "",
            img: undefined,
            track: undefined,
            sound: undefined
        });
    }
    const affectedParamsCount = r.int32();
    for (let i = 0; i < affectedParamsCount; i++) {
        const paramN = r.int32();

        const change = r.int32();
        const showingType = r.byte() as ParameterShowingType;

        const changeType = r.byte() as ParameterChangeType;
        const isChangePercentage =
            changeType === ParameterChangeType.Percentage;
        const isChangeValue = changeType === ParameterChangeType.Value;
        const isChangeFormula = changeType === ParameterChangeType.Formula;
        const changingFormula = r.readString();
        const critText = r.readString();
        const img = r.readString();
        const sound = r.readString();
        const track = r.readString();
        paramsChanges[paramN - 1] = {
            change,
            showingType,
            isChangePercentage,
            isChangeFormula,
            isChangeValue,
            changingFormula,
            critText,
            img,
            track,
            sound
        };
    }
    const texts: string[] = [];
    const media: Media[] = [];
    const locationTexts = r.int32();
    for (let i = 0; i < locationTexts; i++) {
        const text = r.readString();
        texts.push(text);
        const img = r.readString();
        const sound = r.readString();
        const track = r.readString();
        media.push({ img, track, sound });
    }

    const isTextByFormula = !!r.byte();
    const textSelectFurmula = r.readString();
    // console.info(isTextByFormula, textSelectFurmula)
    // r.debugShowHex(0); // must be 3543
    return {
        dayPassed,
        id,
        isEmpty,
        isFaily,
        isFailyDeadly,
        isStarting,
        isSuccess,
        paramsChanges,
        texts,
        media,
        isTextByFormula,
        textSelectFurmula,
        maxVisits
    };
}

interface JumpParameterCondition {
    mustFrom: number;
    mustTo: number;
    mustEqualValues: number[];
    mustEqualValuesEqual: boolean;
    mustModValues: number[];
    mustModValuesMod: boolean;
}
export interface Jump extends Media {
    prio: number;
    dayPassed: boolean;
    id: number;
    fromLocationId: number;
    toLocationId: number;
    alwaysShow: boolean;
    jumpingCountLimit: number;
    showingOrder: number;
    paramsChanges: ParameterChange[];
    paramsConditions: JumpParameterCondition[];
    formulaToPass: string;
    text: string;
    description: string;
}

function parseJump(r: Reader, paramsCount: number): Jump {
    const prio = r.float64();
    const dayPassed = !!r.int32();
    const id = r.int32();
    const fromLocationId = r.int32();
    const toLocationId = r.int32();
    r.seek(1);
    const alwaysShow = !!r.byte();
    const jumpingCountLimit = r.int32();
    const showingOrder = r.int32();

    const paramsChanges: ParameterChange[] = [];
    const paramsConditions: JumpParameterCondition[] = [];
    for (let i = 0; i < paramsCount; i++) {
        r.seek(4);
        const mustFrom = r.int32();
        const mustTo = r.int32();
        const change = r.int32();
        const showingType = r.int32() as ParameterShowingType;
        r.seek(1);
        const isChangePercentage = !!r.byte();
        const isChangeValue = !!r.byte();
        const isChangeFormula = !!r.byte();
        const changingFormula = r.readString();

        const mustEqualValuesCount = r.int32();
        const mustEqualValuesEqual = !!r.byte();
        const mustEqualValues: number[] = [];
        //console.info(`mustEqualValuesCount=${mustEqualValuesCount}`)
        for (let ii = 0; ii < mustEqualValuesCount; ii++) {
            mustEqualValues.push(r.int32());
            //  console.info('pushed');
        }
        //console.info(`eq=${mustEqualValuesNotEqual} values = ${mustEqualValues.join(', ')}`)
        const mustModValuesCount = r.int32();
        //console.info(`mustModValuesCount=${mustModValuesCount}`)
        const mustModValuesMod = !!r.byte();
        const mustModValues: number[] = [];
        for (let ii = 0; ii < mustModValuesCount; ii++) {
            mustModValues.push(r.int32());
        }

        const critText = r.readString();
        // console.info(`Param ${i} crit text =${critText}`)
        paramsChanges.push({
            change,
            showingType,
            isChangeFormula,
            isChangePercentage,
            isChangeValue,
            changingFormula,
            critText,
            img: undefined,
            track: undefined,
            sound: undefined
        });
        paramsConditions.push({
            mustFrom,
            mustTo,
            mustEqualValues,
            mustEqualValuesEqual,
            mustModValues,
            mustModValuesMod
        });
    }

    const formulaToPass = r.readString();

    const text = r.readString();

    const description = r.readString();

    return {
        prio,
        dayPassed,
        id,
        fromLocationId,
        toLocationId,
        alwaysShow,
        jumpingCountLimit,
        showingOrder,
        paramsChanges,
        paramsConditions,
        formulaToPass,
        text,
        description,
        img: undefined,
        track: undefined,
        sound: undefined
    };
}

function parseJumpQmm(
    r: Reader,
    paramsCount: number,
    questParams: QMParam[]
): Jump {
    //r.debugShowHex()
    const prio = r.float64();
    const dayPassed = !!r.int32();
    const id = r.int32();
    const fromLocationId = r.int32();
    const toLocationId = r.int32();

    const alwaysShow = !!r.byte();
    const jumpingCountLimit = r.int32();
    const showingOrder = r.int32();

    const paramsChanges: ParameterChange[] = [];
    const paramsConditions: JumpParameterCondition[] = [];

    for (let i = 0; i < paramsCount; i++) {
        paramsChanges.push({
            change: 0,
            showingType: ParameterShowingType.НеТрогать,
            isChangeFormula: false,
            isChangePercentage: false,
            isChangeValue: false,
            changingFormula: "",
            critText: "",
            img: undefined,
            track: undefined,
            sound: undefined
        });
        paramsConditions.push({
            mustFrom: questParams[i].min,
            mustTo: questParams[i].max,
            mustEqualValues: [],
            mustEqualValuesEqual: false,
            mustModValues: [],
            mustModValuesMod: false
        });
    }
    const affectedConditionsParamsCount = r.int32();
    for (let i = 0; i < affectedConditionsParamsCount; i++) {
        const paramId = r.int32();

        const mustFrom = r.int32();
        const mustTo = r.int32();

        const mustEqualValuesCount = r.int32();
        const mustEqualValuesEqual = !!r.byte();
        const mustEqualValues: number[] = [];
        //console.info(`mustEqualValuesCount=${mustEqualValuesCount}`)
        for (let ii = 0; ii < mustEqualValuesCount; ii++) {
            mustEqualValues.push(r.int32());
            //  console.info('pushed');
        }

        const mustModValuesCount = r.int32();
        const mustModValuesMod = !!r.byte();
        const mustModValues: number[] = [];
        for (let ii = 0; ii < mustModValuesCount; ii++) {
            mustModValues.push(r.int32());
        }

        paramsConditions[paramId - 1] = {
            mustFrom,
            mustTo,
            mustEqualValues,
            mustEqualValuesEqual,
            mustModValues,
            mustModValuesMod
        };
    }

    const affectedChangeParamsCount = r.int32();
    for (let i = 0; i < affectedChangeParamsCount; i++) {
        const paramId = r.int32();
        const change = r.int32();

        const showingType = r.byte() as ParameterShowingType;

        const changingType = r.byte() as ParameterChangeType;

        const isChangePercentage =
            changingType === ParameterChangeType.Percentage;
        const isChangeValue = changingType === ParameterChangeType.Value;
        const isChangeFormula = changingType === ParameterChangeType.Formula;
        const changingFormula = r.readString();

        const critText = r.readString();

        const img = r.readString();
        const sound = r.readString();
        const track = r.readString();

        // console.info(`Param ${i} crit text =${critText}`)
        paramsChanges[paramId - 1] = {
            change,
            showingType,
            isChangeFormula,
            isChangePercentage,
            isChangeValue,
            changingFormula,
            critText,
            img,
            track,
            sound
        };
    }

    const formulaToPass = r.readString();

    const text = r.readString();

    const description = r.readString();
    const img = r.readString();
    const sound = r.readString();
    const track = r.readString();

    return {
        prio,
        dayPassed,
        id,
        fromLocationId,
        toLocationId,
        alwaysShow,
        jumpingCountLimit,
        showingOrder,
        paramsChanges,
        paramsConditions,
        formulaToPass,
        text,
        description,
        img,
        track,
        sound
    };
}

export function parse(data: Buffer): QM {
    const r = new Reader(data);
    const header = r.int32() as HeaderMagic;

    const base = parseBase(r, header);

    const isQmm = header === 0x423a35d6 || header === 0x423a35d7;
    const params: QMParam[] = [];
    for (let i = 0; i < base.paramsCount; i++) {
        params.push(isQmm ? parseParamQmm(r) : parseParam(r));
    }

    const base2 = parseBase2(r, isQmm);

    const locations: Location[] = [];

    for (let i = 0; i < base2.locationsCount; i++) {
        locations.push(
            isQmm
                ? parseLocationQmm(r, base.paramsCount)
                : parseLocation(r, base.paramsCount)
        );
    }

    const jumps: Jump[] = [];
    for (let i = 0; i < base2.jumpsCount; i++) {
        jumps.push(
            isQmm
                ? parseJumpQmm(r, base.paramsCount, params)
                : parseJump(r, base.paramsCount)
        );
    }

    if (r.isNotEnd()) {
        throw new Error(r.isNotEnd());
    }

    return {
        ...base,
        ...base2,
        params: params,
        locations,
        jumps
    };
}

export function getImagesListFromQmm(qmmQuest: QM) {
    let images: {
        [imageName: string]: string[];
    } = {};
    let tracks: (string | undefined)[] = [];
    let sounds: (string | undefined)[] = [];

    const addImg = (name: string | undefined, place: string) => {
        if (!name) {
            return;
        }
        if (images[name]) {
            images[name].push(place);
        } else {
            images[name] = [place];
        }
    };

    qmmQuest.params.map((p, pid) => {
        addImg(p.img, `Param p${pid}`);
        tracks.push(p.track);
        sounds.push(p.sound);
    });

    for (const l of qmmQuest.locations) {
        l.media.map(x => x.img).map(x => addImg(x, `Loc ${l.id}`));
        tracks.concat(...l.media.map(x => x.track));
        sounds.concat(...l.media.map(x => x.sound));

        l.paramsChanges.map((p, pid) => {
            l.media
                .map(x => x.img)
                .map(x => addImg(x, `Loc ${l.id} p${pid + 1}`));
            tracks.push(p.track);
            sounds.push(p.sound);
        });
    }

    qmmQuest.jumps.map((j, jid) => {
        addImg(j.img, `Jump ${jid}`);

        tracks.push(j.track);
        sounds.push(j.sound);

        j.paramsChanges.map((p, pid) => {
            addImg(p.img, `Jump ${jid} p${pid}`);
            tracks.push(p.track);
            sounds.push(p.sound);
        });
    });

    tracks = tracks.filter(x => x);
    sounds = sounds.filter(x => x);

    return Object.keys(images);
}
