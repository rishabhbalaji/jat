import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://uwighatupyfpxxfpaepa.supabase.co', 'sb_publishable_dx28X_2BttvT7-GJii_gOg_cgyt3Vdl')
async function run() {
  const { data, error } = await supabase.from('jobs').select('*')
  console.log('Error:', error)
  console.log('Data:', data)
}
run()
