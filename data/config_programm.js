// config_programm.js

//Default-Programm als XML-String definieren:
const defaultProgramXml = `

<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="stift_start" id="b0_1750434210712" deletable="false" x="131" y="154">
    <statement name="NEXT">
      <block type="custom_repeat" id="b1_1750434210712">
        <field name="TIMES">3</field>
        <statement name="DO">
          <block type="stift_gehe" id="b2_1750434210712">
            <field name="STEPS">40</field>
            <field name="DIRECTION">FORWARD</field>
            <next>
              <block type="stift_drehe" id="b3_1750434210712">
                <field name="DIRECTION">LEFT</field>
                <field name="ANGLE">72</field>
              </block>
            </next>
          </block>
        </statement>
      </block>
    </statement>
  </block>
</xml>

`;
