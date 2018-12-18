const SPACING = {
    wall: '\t',
    key_real: '\t\t',
    real_fake: '\t\t\t',

    xyz: '\t\t',
    movmt: '\t\t'
};

const IGNORED_KEY_TYPES = ['type', 'packet'];

class Debugger{
    constructor(dispatch) {
        const command = dispatch.command;
        let realStage = [], fakeStage = [];
        let realAbnormal = [], fakeAbnormal = [];
        let gameId;
        let debugStates = {
            skill: false,
            abnormality: false
        };

        function cmdDebug(key) {
            debugStates[key] = !debugStates[key];
            command.message(`${key} debugging has been ${debugStates[key]?'en':'dis'}abled.`);
        }
        command.add('skillDebug', cmdDebug.bind(null, 'skill'));
        command.add('abnDebug', cmdDebug.bind(null, 'abnormality'));
        command.add('abnormDebug', cmdDebug.bind(null, 'abnormality'));
        command.add('abnormalDebug', cmdDebug.bind(null, 'abnormality'));

        function cmdClear() {
            realStage = []; fakeStage = [];
            realAbnormal = []; fakeAbnormal = [];
        }
        command.add('clear', cmdClear);

        function cmdPrintReal(real, fake) {
            for(let i=0;i<real.length;i++) {
                console.log(`Packet: ${real[i].packet} (${real[i].id})`);
                for(let key in real[i]) {
                    if(IGNORED_KEY_TYPES.includes(key)) continue;
                    let msg = SPACING.wall;
                    
                    if(key == "time") {
                        switch(real[i].type) {
                            case 'start': case 'refresh': {
                                msg += `time${SPACING.key_real}${('0000' + (real[i].time % 10000)).substr(-4, 4)}${SPACING[key] || SPACING.real_fake}`;
                                try {
                                    msg += ('0000' + (fake[i].time % 10000)).substr(-4, 4);
                                }catch(e) { msg += 'N/A'; }
                                break;
                            }
                            case 'end': case 'fail': {
                                msg += `time${SPACING.key_real}${real[i].time - real[i - 1].time}${SPACING[key] || SPACING.real_fake}`;
                                try {
                                    msg += (fake[i].time - fake[i - 1].time).toString();
                                }catch(e) { msg += 'N/A'; }
                                break;
                            }
                        }
                    }else{
                        msg += `${key}${SPACING.key_real}${real[i][key]}${SPACING[key] || SPACING.real_fake}`;
                        try {
                            msg += `${fake[i][key]}`;
                        }catch(e) { msg += "N/A"; }
                    }
                    console.log(msg);
                }
                console.log('');
            }
            for(let i=0;i<1;i++) console.log('');
            console.log('-------------------------------------------------');
            for(let i=0;i<2;i++) console.log('');
        }
        command.add('print', ()=> cmdPrintReal(realStage, fakeStage));
        command.add('printAbn', ()=> cmdPrintReal(realAbnormal, fakeAbnormal));
        command.add('printAbnorm', ()=> cmdPrintReal(realAbnormal, fakeAbnormal));
        command.add('printAbnormal', ()=> cmdPrintReal(realAbnormal, fakeAbnormal));

        function cmdPrintFake(real, fake) {
            cmdPrintReal(fake, real);
        }
        command.add('fprint', ()=> cmdPrintFake(realStage, fakeStage));
        command.add('fprintAbn', ()=> cmdPrintFake(realAbnormal, fakeAbnormal));
        command.add('fprintAbnorm', ()=> cmdPrintFake(realAbnormal, fakeAbnormal));
        command.add('fprintAbnormal', ()=> cmdPrintFake(realAbnormal, fakeAbnormal));

        function sActionStage(fake, e) {
            if(debugStates.skill && e.gameId === gameId) {
                let info = {
                    packet: 'sActionStage',
                    type: "start",
                    xyz: [Math.round(e.loc.x, 2), Math.round(e.loc.y, 2), Math.round(e.loc.z, 2)].toString(),
                    w: e.w,
                    id: e.skill.id,
                    stage: e.stage,
                    speed: e.speed.toFixed(2),
                    toXYZ: [Math.round(e.dest.x, 2), Math.round(e.dest.y, 2), Math.round(e.dest.z, 2)].toString(),
                    movmt: e.movement.toString(),
                    time: Date.now()
                };
                if(fake) fakeStage.push(info);
                else realStage.push(info);
            }
        }
        dispatch.hook('S_ACTION_STAGE', 8, {order: -999999999, filter:{fake:true}}, sActionStage.bind(null, true));
        dispatch.hook('S_ACTION_STAGE', 8, {order: -999999999, filter:{fake:false}}, sActionStage.bind(null, false));

        function sActionEnd(fake, e) {
            if(debugStates.skill && e.gameId === gameId) {
                let info = {
                    packet: 'sActionEnd',
                    type: "end",
                    xyz: [Math.round(e.loc.x, 2), Math.round(e.loc.y, 2), Math.round(e.loc.z, 2)].toString(),
                    w: e.w,
                    endType: e.type,
                    id: e.skill.id,
                    time: Date.now()
                };
                if(fake) fakeStage.push(info);
                else realStage.push(info);
            }
        }
        dispatch.hook('S_ACTION_END', 5, {order: -999999999, filter:{fake:true}}, sActionEnd.bind(null, true));
        dispatch.hook('S_ACTION_END', 5, {order: -999999999, filter:{fake:false}}, sActionEnd.bind(null, false));


        function sLogin(e) {
            gameId = e.gameId;
        }
        dispatch.hook('S_LOGIN', 10, sLogin);
    }
}

module.exports = Debugger;
