import { AdminService } from './admin.service';
import { AdminRepository } from '../repositories/admin.repository';

// Mock the repository class
jest.mock('../repositories/admin.repository');

describe('AdminService Image Handling', () => {
    let service: AdminService;
    let mockRepoInstance: any;

    beforeEach(() => {
        // Clear all mocks
        (AdminRepository as any).mockClear();
        
        // Instantiate service, which triggers new AdminRepository()
        service = new AdminService();
        
        // Get the mock instance
        mockRepoInstance = (AdminRepository as any).mock.instances[0];
    });

    it('createProduct should correctly map multiple images from repository response', async () => {
        const inputData = {
            name: 'Test Product',
            description: 'Desc',
            priceCents: 1000,
            images: ['/uploads/1.jpg', '/uploads/2.jpg'],
            initialStock: 10
        };

        const mockDbResponse = {
            id: BigInt(100),
            name: 'Test Product',
            description: 'Desc',
            priceCents: 1000,
            variants: [{ id: BigInt(1), initialStock: 10, reservedStock: 0 }],
            images: [
                { id: BigInt(50), url: '/uploads/1.jpg', order: 0 },
                { id: BigInt(51), url: '/uploads/2.jpg', order: 1 }
            ]
        };

        // Mock the repository method
        mockRepoInstance.createProductWithVariant.mockResolvedValue(mockDbResponse);

        // Execute service method
        const result = await service.createProduct(inputData);

        // Verify repository call
        expect(mockRepoInstance.createProductWithVariant).toHaveBeenCalledWith(
            expect.objectContaining({ 
                name: 'Test Product',
                images: ['/uploads/1.jpg', '/uploads/2.jpg'] 
            }),
            10
        );

        // Verify result mapping
        expect(result.id).toBe('100');
        expect(result.images).toBeDefined();
        expect(result.images).toHaveLength(2);
        expect(result.images[0]).toEqual({
            id: '50',
            url: '/uploads/1.jpg',
            order: 0
        });
        expect(result.images[1]).toEqual({
            id: '51',
            url: '/uploads/2.jpg',
            order: 1
        });
    });

    it('updateProduct should correctly map new images', async () => {
        const updateData = {
            name: 'Updated Product',
            newImages: ['/uploads/3.jpg']
        };

        const mockDbResponse = {
            id: BigInt(100),
            name: 'Updated Product',
            images: [
                { id: BigInt(50), url: '/uploads/1.jpg', order: 0 }, // Existing
                { id: BigInt(52), url: '/uploads/3.jpg', order: 1 }  // New
            ]
        };

        mockRepoInstance.updateProduct.mockResolvedValue(mockDbResponse);

        const result = await service.updateProduct(100, updateData);

        expect(mockRepoInstance.updateProduct).toHaveBeenCalledWith(
            100,
            expect.objectContaining({ name: 'Updated Product' }),
            undefined,
            ['/uploads/3.jpg']
        );

        expect(result.id).toBe('100');
        expect(result.images).toHaveLength(2);
        expect(result.images[1].url).toBe('/uploads/3.jpg');
    });

    it('getProduct should map images correctly', async () => {
        const mockDbResponse = {
            id: BigInt(100),
            name: 'Test Product',
            variants: [],
            images: [
                { id: BigInt(50), url: '/uploads/1.jpg', order: 0 }
            ]
        };

        mockRepoInstance.findProductById.mockResolvedValue(mockDbResponse);

        const result = await service.getProduct(100);

        expect(result).not.toBeNull();
        if (result) {
            expect(result.id).toBe('100');
            expect(result.images).toHaveLength(1);
            expect(result.images[0].url).toBe('/uploads/1.jpg');
        }
    });
});
