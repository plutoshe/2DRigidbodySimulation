
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
var shaders = {
	generalVert,
	generalFrag,
}

function getShader(id){
  return shaders[id];
}