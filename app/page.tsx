import { supabase } from '../lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('resources').select('*')
  
  return (
    <div>
      <h1>StemSista</h1>
      <p>Connection test:</p>
      {error ? (
        <p style={{color: 'red'}}>Error: {error.message}</p>
      ) : (
        <p style={{color: 'green'}}>Connected! Resources: {data?.length ?? 0}</p>
      )}
    </div>
  )
}