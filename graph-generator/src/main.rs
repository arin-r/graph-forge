use rand::Rng;
use std::fs::{self, File};
use std::io::Write;
use std::path::Path;

fn main() -> std::io::Result<()> {
    let mut rng = rand::thread_rng();

    // Directory to save tests
    let out_dir = "../test_graphs";
    if !Path::new(out_dir).exists() {
        fs::create_dir(out_dir)?;
    }

    println!("Generating random test graphs...");

    // Generate 5 random graphs
    for i in 1..=5 {
        let n: usize = rng.gen_range(10..=20);
        // Make the graph extremely sparse by targeting a very low average degree
        let target_degree: f64 = rng.gen_range(0.8..=1.5);
        let prob = target_degree / (n as f64);

        let mut matrix = vec![vec![0; n]; n];
        let mut adj_list: Vec<Vec<usize>> = vec![Vec::new(); n];

        // Populate matrix and list (directed graph representation)
        for u in 0..n {
            for v in 0..n {
                if u != v && rng.gen_bool(prob) {
                    matrix[u][v] = 1;
                    adj_list[u].push(v);
                }
            }
        }

        // Write Adjacency Matrix
        let matrix_path = format!("{}/graph_{}_matrix.txt", out_dir, i);
        let mut f_matrix = File::create(&matrix_path)?;
        for u in 0..n {
            let row: Vec<String> = matrix[u].iter().map(|&w| w.to_string()).collect();
            writeln!(f_matrix, "{}", row.join(" "))?;
        }
        println!("Created: {}", matrix_path);

        // Write Adjacency List
        let list_path = format!("{}/graph_{}_list.txt", out_dir, i);
        let mut f_list = File::create(&list_path)?;
        for u in 0..n {
            if !adj_list[u].is_empty() {
                let edges: Vec<String> = adj_list[u].iter().map(|&v| v.to_string()).collect();
                writeln!(f_list, "{}: {}", u, edges.join(" "))?;
            } else {
                writeln!(f_list, "{}:", u)?; // To record isolated nodes
            }
        }
        println!("Created: {}", list_path);
    }

    println!("Graph generation complete!");
    Ok(())
}
