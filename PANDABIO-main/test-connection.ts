import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
  process.exit(1);
}

console.log('Testando conexão com Supabase...');
console.log('URL:', supabaseUrl ? 'Configurada' : 'Não configurada');
console.log('Key:', supabaseAnonKey ? 'Configurada' : 'Não configurada');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Testar conexão básica
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.error('Erro na conexão:', error.message);
      console.log(
        '  A tabela users não existe. Você precisa executar o schema.sql no painel do Supabase.',
      );
      process.exit(1);
    }

    console.log(' Conexão com Supabase estabelecida com sucesso!');
    console.log('Dados retornados:', data);

    // Testar se a tabela users existe
    const { error: tableError } = await supabase.from('users').select('*').limit(1);

    if (tableError) {
      console.log('  Tabela users pode não existir ainda:', tableError.message);
    } else {
      console.log(' Tabela users acessível');
    }
  } catch (error) {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }
}

testConnection();
