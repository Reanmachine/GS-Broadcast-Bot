 <?php
 header('Access-Control-Allow-Origin: *');  
 
  $queryIsSet = isset($_REQUEST['q']);
  if ($queryIsSet) {
    echo "Question: " . $_REQUEST['q']." | \n";;
  } else {
    echo "invalid request, nothing passed";
    die();
  }

  include 'wa_wrapper/WolframAlphaEngine.php';
  include 'config.php';

  if (!$queryIsSet) die();

  $qArgs = array();
  if (isset($_REQUEST['assumption']))
    $qArgs['assumption'] = $_REQUEST['assumption'];

  // instantiate an engine object with your app id
  $engine = new WolframAlphaEngine( $config['appID'] );

  // we will construct a basic query to the api with the input 'pi'
  // only the bare minimum will be used
  $response = $engine->getResults( $_REQUEST['q'], $qArgs);

  if ( $response->isError() ) {
    echo "Sorry looks like there was a problem with the query. Maybe we're out of queries this month?";
    die();
  }

$pods = $response->getPods();

if (count($pods) > 0) {
    $questionSubpods = $pods[0]->getSubpods();
    $answerSubpods = $pods[1]->getSubpods();

    echo "Interpretted as: ".$questionSubpods[0]->plaintext." | \n";
    echo "Answer: ".$answerSubpods[0]->plaintext."\n";
}
else 
{
    echo "No Results found, or unable to parse your question.";
    }