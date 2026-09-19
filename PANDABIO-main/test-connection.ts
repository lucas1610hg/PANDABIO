import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Credenciais fornecidas
const supabaseUrl = "https://irtrqccahpaxknidrxwy.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlydHJxY2NhaHBheGtuaWRyeHd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTYxNjAsImV4cCI6MjEwNTMzMjE2MH0.Ny3rHQsK0ARq2BbTsYBSr--pTvEE0gO49dq5DDCK0Sk";

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
      console.log('⚠️  A tabela users não existe. Você precisa executar o schema.sql no painel do Supabase.');
      process.exit(1);
    }
    
    console.log('✅ Conexão com Supabase estabelecida com sucesso!');
    console.log('Dados retornados:', data);
    
    // Testar se a tabela users existe
    const { data: tableData, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('⚠️  Tabela users pode não existir ainda:', tableError.message);
    } else {
      console.log('✅ Tabela users acessível');
    }
    
  } catch (error) {
    console.error('Erro inesperado:', error);
    process.exit(1);
  }
}

testConnection();
