
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

var glslFileList = [
    "generalVert",
    "generalFrag",
    "textureSetVert",
    "textureSetFrag",
    "drawingVert",
    "drawingFrag",
    "positionUpdateVert",
    "positionUpdateFrag",
    "velocityUpdateVert",
    "velocityUpdateFrag",
    "forceUpdateVert",
    "forceUpdateFrag",
    "testFrag",
    "testVert",
    "shared",
    "convertParticleToCellVert",
    "convertParticleToCellFrag",
    "printTextureVert",
    "printTextureFrag",
    "updateMomentumVert",
    "updateMomentumFrag"];

var shaderDirPath = "../../glsl/";
var shaders = [];
for (var i = 0; i < glslFileList.length; i++) {
    var path = shaderDirPath + glslFileList[i] + ".glsl";
    shaders[glslFileList[i]] = readTextFile(path);    
}
function getShader(id){
    if (id != "shared")
        return shaders.shared + "\n" + shaders[id];
    else 
        return shaders[id];
}