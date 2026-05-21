import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

public class PercolationTest {

    @Test
    public void testNEqualsOneBlocked() {
        Percolation p = new Percolation(1);

        assertFalse(p.isOpen(0, 0));
        assertFalse(p.isFull(0, 0));
        assertFalse(p.percolates());
        assertEquals(0, p.numberOfOpenSites());
    }

    @Test
    public void testNEqualsOneOpen() {
        Percolation p = new Percolation(1);
        p.open(0, 0);

        assertTrue(p.isOpen(0, 0));
        assertTrue(p.isFull(0, 0));
        assertTrue(p.percolates());
        assertEquals(1, p.numberOfOpenSites());
    }

    @Test
    public void testVerticalPathPercolates() {
        Percolation p = new Percolation(3);

        p.open(0, 1);
        p.open(1, 1);
        p.open(2, 1);

        assertTrue(p.isOpen(0, 1));
        assertTrue(p.isOpen(1, 1));
        assertTrue(p.isOpen(2, 1));

        assertTrue(p.isFull(0, 1));
        assertTrue(p.isFull(1, 1));
        assertTrue(p.isFull(2, 1));

        assertTrue(p.percolates());
        assertEquals(3, p.numberOfOpenSites());
    }

    @Test
    public void testNoPercolation() {
        Percolation p = new Percolation(3);
        p.open(0, 0);
        p.open(1, 0);
        assertTrue(p.isOpen(0, 0));
        assertTrue(p.isOpen(1, 0));

        assertTrue(p.isFull(0, 0));
        assertTrue(p.isFull(1, 0));

        assertFalse(p.percolates());
        assertEquals(2, p.numberOfOpenSites());}}

