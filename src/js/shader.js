
function readTextFile(file)
{
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    var allText = "1";
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                allText = rawFile.responseText;
                //alert(allText);
            }
        }
    }
    rawFile.send(null);
    return allText;
}

generalVert = readTextFile('../../glsl/generalVert.glsl');
generalFrag = readTextFile('../../glsl/generalFrag.glsl');
textureSetVert = readTextFile("../../glsl/textureSetVert.glsl");
textureSetFrag = readTextFile("../../glsl/textureSetFrag.glsl");
drawingVert = readTextFile("../../glsl/drawingVert.glsl");
drawingFrag = readTextFile("../../glsl/drawingFrag.glsl");
positionUpdateVert = readTextFile("../../glsl/positionUpdateVert.glsl");
positionUpdateFrag = readTextFile("../../glsl/positionUpdateFrag.glsl");
velocityUpdateVert = readTextFile("../../glsl/velocityUpdateVert.glsl");
velocityUpdateFrag = readTextFile("../../glsl/velocityUpdateFrag.glsl");
forceUpdateVert = readTextFile("../../glsl/forceUpdateVert.glsl");
forceUpdateFrag = readTextFile("../../glsl/forceUpdateFrag.glsl");
testFrag = readTextFile("../../glsl/testFrag.glsl");
testVert = readTextFile("../../glsl/testVert.glsl");
shared = readTextFile("../../glsl/shared.glsl");
convertParticleToCellVert = readTextFile("../../glsl/convertParticleToCellVert.glsl");
convertParticleToCellFrag = readTextFile("../../glsl/convertParticleToCellFrag.glsl");
printTextureVert = readTextFile("../../glsl/printTextureVert.glsl");
printTextureFrag = readTextFile("../../glsl/printTextureFrag.glsl");


var shaders = {
    printTextureVert,
    printTextureFrag,
	generalVert,
	generalFrag,
	textureSetVert,
	textureSetFrag,
    positionUpdateVert,
    positionUpdateFrag,
    velocityUpdateVert,
    velocityUpdateFrag,
    drawingVert,
    drawingFrag,
    testFrag,
    testVert,
	shared,
    convertParticleToCellVert,
    convertParticleToCellFrag,
    forceUpdateVert,
    forceUpdateFrag,
}

function getShader(id){
  return shared + shaders[id];
}