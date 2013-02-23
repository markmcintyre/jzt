window.jzt = window.jzt || {};
jzt.ParserFactory = jzt.ParserFactory || {};
  
/*
 * Move Command Parser
 *
 * command = syntax1 | syntax2;
 * syntax1 = # "move" modifier* direction
 * syntax2 = # "move" modifier* direction count
 * modifier = cw | ccw | opp | rndp;
 * direction = n | s | e | w | north | south | east | west | seek
 *            | flow | rand | randf | randb | rndns | rndew | rndne
 * count = NumberLiteral            
 */
jzt.ParserFactory.createMoveCommandParser = function() {
    
      // Establish shorthand to cut character count
      var l = jzt.parser.LiteralTerminal;
      var a = jzt.parser.Alternation;
      var s = jzt.parser.Sequence;
      var r = jzt.parser.Repetition;
    
      // Our resulting command
      var result = new s();
      
      // Modifier
      var mod = new a();
      mod.add(new l('cw'));
      mod.add(new l('ccw'));
      mod.add(new l('opp'));
      mod.add(new l('rndp'));
      
      // Direction
      var dir = new a();
      dir.add(new l('n'));
      dir.add(new l('e'));
      dir.add(new l('s'));
      dir.add(new l('w'));
      dir.add(new l('north'));
      dir.add(new l('east'));
      dir.add(new l('south'));
      dir.add(new l('west'));
      dir.add(new l('seek'));
      dir.add(new l('flow'));
      dir.add(new l('rand'));
      dir.add(new l('randf'));
      dir.add(new l('randb'));
      dir.add(new l('rndns'));
      dir.add(new l('rndew'));
      dir.add(new l('rndne'));
      
      // Nothing or Count
      var option = new a();
      option.add(new jzt.parser.NumberTerminal());
      option.add(new jzt.parser.Empty());
      
      // RESULT
      result.add(new l('#'));
      result.add(new l('move'));
      result.add(new r(mod));
      result.add(dir);
      result.add(option);
      
      return result;
      
};