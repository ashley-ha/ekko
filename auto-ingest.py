from pathlib import Path

from gitingest import ingest

# Run this script to generate the codebase context to use when asking claude, gemini, etc

base_path = Path('.')
src_path = Path('./src')
output_dir = Path('./.ingest_output')
directories_to_ingest = ['src/components', 'src/types', 'src/contexts', 'src/data', 'src/lib', 'src/store', 'src/hooks', 'supabase', 'extension']

# Create output directory if it doesn't exist
output_dir.mkdir(exist_ok=True)

# First, generate the entire codebase directory tree
print('\nGenerating entire codebase directory tree...')
try:
    summary, tree, _ = ingest(str(src_path))
    print('\nSummary:')
    print(summary)

    # Save tree structure to a file
    output_file = output_dir / 'codebase_structure.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('Directory Structure for: src\n')
        f.write('=' * 50 + '\n\n')
        f.write('DIRECTORY STRUCTURE:\n')
        f.write('-' * 30 + '\n')
        f.write(tree)

    print(f'Tree structure saved to: {output_file}')
    print('-' * 40)
except Exception as e:
    print(f'Error ingesting {src_path}: {e}')
    print('-' * 40)

# Then process individual directories
print('\nProcessing individual directories...')
for directory_name in directories_to_ingest:
    full_path = base_path / directory_name
    if full_path.is_dir():
        print(f'Ingesting directory: {full_path}')
        try:
            summary, tree, content = ingest(str(full_path))
            print('\nSummary:')
            print(summary)

            # Save both tree and content to a single file
            safe_name = directory_name.replace('/', '_').replace('\\', '_')
            output_file = output_dir / f'{safe_name}_directory.txt'
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f'Directory Analysis for: {directory_name}\n')
                f.write('=' * 50 + '\n\n')

                f.write('DIRECTORY STRUCTURE:\n')
                f.write('-' * 30 + '\n')
                f.write(tree)
                f.write('\n' + '=' * 50 + '\n\n')

                f.write('FILE CONTENTS:\n')
                f.write('-' * 30 + '\n')
                f.write(content if content else 'No content')

            print(f'Analysis saved to: {output_file}')
            print('-' * 40)
        except Exception as e:
            print(f'Error ingesting {full_path}: {e}')
            print('-' * 40)
    else:
        print(f'Directory not found: {full_path}')

print('Ingestion process completed.')
