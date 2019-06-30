
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
physicsUpdateVert = readTextFile("../../glsl/physicsUpdateVert.glsl");
physicsUpdateFrag = readTextFile("../../glsl/physicsUpdateFrag.glsl");
shared = readTextFile("../../glsl/shared.glsl");
var shaders = {
	generalVert,
	generalFrag,
	textureSetVert,
	textureSetFrag,
    physicsUpdateVert,
    physicsUpdateFrag,
    drawingVert,
    drawingFrag,
	shared,
}

function getShader(id){
  return shared + shaders[id];
}