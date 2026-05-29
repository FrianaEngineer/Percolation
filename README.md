# Interactive Percolation Visualizer

A Java project that models and visualizes **percolation**, which is the process of checking whether open spaces in a grid create a connected path from the top row to the bottom row.

This project uses the union-find data structure to make percolation checks efficient. It also includes an interactive visualizer where you can click grid cells to open them and watch whether the system percolates.

## Features

- Simulates an `N x N` percolation grid
- Lets users open blocked sites by clicking on the grid
- Shows whether each site is blocked, open, or full
- Detects when the system percolates
- Tracks the number of open sites
- Uses weighted quick union for efficient connectivity checks
- Avoids the backwash issue by using a second union-find structure

## Project Structure

```text
.
├── InteractivePercolationVisualizer.java  # Interactive click-based visualizer
├── Percolation.java                       # Main percolation model
├── PercolationPicture.java                # Drawing and file-based animation helper
├── PercolationTest.java                   # JUnit tests
└── WeightedQuickUnionUF.java              # Local weighted quick union implementation
```

## How It Works

The grid starts with every site blocked. A site can be opened using its row and column position.

A site is considered **full** if it is open and connected to the top row. The system **percolates** if there is a connected path of open sites from the top row to the bottom row.

The main percolation logic is in `Percolation.java`. It uses two union-find structures:

1. One union-find structure checks whether the system percolates.
2. A second union-find structure checks whether a site is full without incorrectly marking bottom-connected sites as full after percolation.

This helps fix the common **backwash** problem.

## Visual Meaning

In the visualizer:

- **Black** sites are blocked
- **White** sites are open but not full
- **Light blue** sites are full
- The status text shows whether the system percolates

## Requirements

You need:

- Java
- Princeton `algs4.jar`
- JUnit 5, only if you want to run the tests

This project uses Princeton classes such as `StdDraw`, `StdOut`, `In`, `StdRandom`, and `WeightedQuickUnionUF`, so make sure `algs4.jar` is included in your classpath.

## Running the Interactive Visualizer

Compile the project:

```bash
javac -cp .:algs4.jar *.java
```

Run the visualizer with the default grid size of `10 x 10`:

```bash
java -cp .:algs4.jar InteractivePercolationVisualizer
```

Run the visualizer with a custom grid size:

```bash
java -cp .:algs4.jar InteractivePercolationVisualizer 20
```

Then click on cells in the grid to open them.


```

## Running a Percolation Animation From a File

`PercolationPicture.java` can animate a percolation system from an input file.

```bash
java -cp .:algs4.jar PercolationPicture inputFiles/input10.txt
```

The input file should start with the grid size, followed by row-column pairs:

```text
5
0 1
1 1
2 1
3 1
4 1
```

## Running Tests

Compile with JUnit:

```bash
javac -cp .:algs4.jar:junit-platform-console-standalone.jar *.java
```

Run the tests:

```bash
java -jar junit-platform-console-standalone.jar --class-path .:algs4.jar --scan-class-path
```

The tests check cases such as:

- A blocked `1 x 1` grid
- An open `1 x 1` grid
- A vertical path that percolates
- A grid that does not percolate

## Example

A `3 x 3` grid percolates when there is an open vertical path from top to bottom:

```text
blocked open   blocked
blocked open   blocked
blocked open   blocked
```

Since the open sites connect the top row to the bottom row, the system percolates.

## Notes

- Rows and columns are zero-indexed.
- The top-left site is `(0, 0)`.
- `open(row, col)` opens a blocked site.
- `isOpen(row, col)` checks whether a site is open.
- `isFull(row, col)` checks whether a site is connected to the top.
- `percolates()` checks whether the system has a top-to-bottom open path.

## Author

Friana Engineer
